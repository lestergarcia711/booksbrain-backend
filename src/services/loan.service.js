import LoanResponseDto from '../dtos/loans/loan.response.dto.js';
import { BadRequestError, ConflictError, NotFoundError } from '../errors/http.errors.js';

// Coordina el motor de préstamos y devoluciones aplicando Unit of Work, bloqueo FOR UPDATE y estado 'Overdue' dinámico.
export default class LoanService {
  #loanRepository;
  #bookCopyRepository;
  #bookRepository;
  #inventoryRepository;
  #userService;
  #unitOfWork;
  #loanConfig;

  constructor(
    loanRepository,
    bookCopyRepository,
    bookRepository,
    inventoryRepository,
    userService,
    unitOfWork,
    loanConfig
  ) {
    this.#loanRepository = loanRepository;
    this.#bookCopyRepository = bookCopyRepository;
    this.#bookRepository = bookRepository;
    this.#inventoryRepository = inventoryRepository;
    this.#userService = userService;
    this.#unitOfWork = unitOfWork;
    this.#loanConfig = loanConfig;
  }

  async getAll({ status, page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;
    const [rows, total] = await Promise.all([
      this.#loanRepository.findAll({ status, limit, offset }),
      this.#loanRepository.count({ status }),
    ]);

    return {
      data: rows.map((row) => new LoanResponseDto(row)),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getById(id, executor) {
    const row = await this.#loanRepository.findById(id, executor);
    if (!row) {
      throw new NotFoundError('Prestamo no encontrado');
    }
    return new LoanResponseDto(row);
  }

  async getClientLoans(clientId, { status, page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;
    const [rows, total] = await Promise.all([
      this.#loanRepository.findAll({ clientId, status, limit, offset }),
      this.#loanRepository.count({ clientId, status }),
    ]);

    return {
      data: rows.map((row) => new LoanResponseDto(row)),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // Si un cliente solicita un préstamo inexistente o perteneciente a otro cliente, devuelve 404.
  async getClientLoanById(clientId, loanId) {
    const row = await this.#loanRepository.findById(loanId);
    if (!row || Number(row.client_id) !== Number(clientId)) {
      throw new NotFoundError('Prestamo no encontrado');
    }
    return new LoanResponseDto(row);
  }

  async create(adminId, loanCreateDto) {
    return this.#unitOfWork.execute(async (connection) => {
      const { clientId, temporaryPassword } = await this.#resolveClient(
        loanCreateDto,
        connection
      );

      const expectedReturnDate = await this.#resolveExpectedReturnDate(
        loanCreateDto.expectedReturnDate,
        connection
      );

      const selectedCopies = await this.#lockRequestedCopies(loanCreateDto, connection);

      const currentActiveCopies = await this.#loanRepository.countActiveCopiesByClient(
        clientId,
        connection
      );

      if (currentActiveCopies + selectedCopies.length > this.#loanConfig.maxActiveCopies) {
        throw new ConflictError(
          `El cliente supera el limite maximo de copias activas permitidas (${this.#loanConfig.maxActiveCopies})`
        );
      }

      const copyIds = selectedCopies.map((copy) => copy.copy_id);
      await this.#bookCopyRepository.updateStatusByIds(copyIds, 'Borrowed', connection);

      const countByBook = new Map();
      for (const copy of selectedCopies) {
        countByBook.set(copy.book_id, (countByBook.get(copy.book_id) ?? 0) + 1);
      }

      for (const [bookId, count] of countByBook.entries()) {
        await this.#inventoryRepository.adjustAvailableStock(bookId, -count, connection);
      }

      const loanId = await this.#loanRepository.createLoan(
        {
          clientId,
          adminId,
          expectedReturnDate,
        },
        connection
      );

      await this.#loanRepository.createLoanDetails(
        loanId,
        selectedCopies.map((copy) => ({
          copyId: copy.copy_id,
          checkoutCondition: copy.physical_condition ?? 'Good',
        })),
        connection
      );

      const loanRow = await this.#loanRepository.findById(loanId, connection);
      return new LoanResponseDto(loanRow, temporaryPassword);
    });
  }

  async returnCopies(loanId, loanReturnDto) {
    return this.#unitOfWork.execute(async (connection) => {
      const loan = await this.#loanRepository.lockLoanById(loanId, connection);
      if (!loan) {
        throw new NotFoundError('Prestamo no encontrado');
      }

      if (loan.status === 'Returned') {
        throw new ConflictError('El prestamo ya fue devuelto en su totalidad');
      }

      const details = await this.#loanRepository.lockLoanDetailsByLoanId(loanId, connection);
      const detailByCopyId = new Map(details.map((detail) => [Number(detail.copy_id), detail]));

      const returns = loanReturnDto.returns;
      const seenCopyIds = new Set();

      for (const item of returns) {
        if (seenCopyIds.has(item.copyId)) {
          throw new BadRequestError(`El ejemplar ${item.copyId} esta repetido en la solicitud de devolucion`);
        }
        seenCopyIds.add(item.copyId);

        const detail = detailByCopyId.get(item.copyId);
        if (!detail) {
          throw new BadRequestError(`El ejemplar ${item.copyId} no pertenece a este prestamo`);
        }
        if (detail.checkin_condition !== null) {
          throw new ConflictError(`El ejemplar ${item.copyId} ya fue devuelto previamente`);
        }
      }

      // Ordena por copyId ASC para actualizar book_copies e inventory en orden determinista.
      const sortedReturns = [...returns].sort((a, b) => a.copyId - b.copyId);

      for (const item of sortedReturns) {
        const detail = detailByCopyId.get(item.copyId);
        const isPoor = item.checkinCondition === 'Poor';
        const nextStatus = isPoor ? 'Maintenance' : 'Available';

        await this.#loanRepository.updateDetailCheckin(
          detail.loan_detail_id,
          item.checkinCondition,
          connection
        );

        await this.#bookCopyRepository.updateConditionAndStatus(
          item.copyId,
          item.checkinCondition,
          nextStatus,
          connection
        );

        if (nextStatus === 'Available') {
          await this.#inventoryRepository.adjustAvailableStock(detail.book_id, 1, connection);
        }
        detail.checkin_condition = item.checkinCondition;
      }

      const allReturned = details.every((detail) => detail.checkin_condition !== null);
      if (allReturned) {
        await this.#loanRepository.markAsReturned(loanId, connection);
      }

      const updatedLoan = await this.#loanRepository.findById(loanId, connection);
      return new LoanResponseDto(updatedLoan);
    });
  }

  async #resolveClient(loanCreateDto, connection) {
    if (loanCreateDto.client) {
      const createdUserDto = await this.#userService.create(loanCreateDto.client, connection);
      const serialized = createdUserDto.toJSON();
      return {
        clientId: serialized.id,
        temporaryPassword: serialized.temporaryPassword,
      };
    }

    await this.#userService.assertClientExists(loanCreateDto.clientId, connection);
    return {
      clientId: loanCreateDto.clientId,
      temporaryPassword: undefined,
    };
  }

  async #resolveExpectedReturnDate(customDate, connection) {
    if (!customDate) {
      return this.#loanRepository.getDefaultReturnDate(
        this.#loanConfig.defaultDays,
        connection
      );
    }

    const today = await this.#loanRepository.getCurrentDate(connection);
    if (String(customDate) <= String(today)) {
      throw new BadRequestError('La fecha esperada de devolucion debe ser una fecha futura');
    }
    return customDate;
  }

  async #lockRequestedCopies(loanCreateDto, connection) {
    if (Array.isArray(loanCreateDto.copyIds) && loanCreateDto.copyIds.length > 0) {
      const locked = await this.#bookCopyRepository.lockByIds(
        loanCreateDto.copyIds,
        connection
      );
      if (locked.length !== loanCreateDto.copyIds.length) {
        throw new NotFoundError('Uno o mas ejemplares indicados no existen');
      }
      const unavailable = locked.filter((copy) => copy.status !== 'Available');
      if (unavailable.length > 0) {
        throw new ConflictError(
          `Ejemplares no disponibles para prestamo: ${unavailable.map((c) => c.copy_id).join(', ')}`
        );
      }
      return locked;
    }

    if (Array.isArray(loanCreateDto.bookIds) && loanCreateDto.bookIds.length > 0) {
      const requestedByBook = new Map();
      for (const bookId of loanCreateDto.bookIds) {
        requestedByBook.set(bookId, (requestedByBook.get(bookId) ?? 0) + 1);
      }

      const sortedEntries = [...requestedByBook.entries()].sort(([a], [b]) => a - b);
      const selectedCopies = [];

      for (const [bookId, quantity] of sortedEntries) {
        const book = await this.#bookRepository.findById(bookId, connection);
        if (!book) {
          throw new NotFoundError(`El libro con id ${bookId} no existe`);
        }

        const availableCopies = await this.#bookCopyRepository.lockAvailableByBookId(
          bookId,
          quantity,
          connection
        );

        if (availableCopies.length < quantity) {
          throw new ConflictError(
            `Stock insuficiente para prestamo del libro "${book.title}". Solicitado: ${quantity}, disponible: ${availableCopies.length}`
          );
        }

        selectedCopies.push(...availableCopies);
      }

      return selectedCopies.sort((a, b) => a.copy_id - b.copy_id);
    }

    throw new BadRequestError('Debes enviar copyIds o bookIds para registrar el prestamo');
  }
}
