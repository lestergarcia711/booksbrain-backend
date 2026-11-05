import PurchaseResponseDto from '../dtos/purchases/purchase.response.dto.js';
import { AppError, ConflictError, NotFoundError } from '../errors/http.errors.js';

// Coordina el motor de ventas presenciales con Unit of Work, bloqueo FOR UPDATE y cálculo exacto en centavos.
export default class PurchaseService {
  #purchaseRepository;
  #bookCopyRepository;
  #bookRepository;
  #inventoryRepository;
  #userService;
  #unitOfWork;

  constructor(
    purchaseRepository,
    bookCopyRepository,
    bookRepository,
    inventoryRepository,
    userService,
    unitOfWork
  ) {
    this.#purchaseRepository = purchaseRepository;
    this.#bookCopyRepository = bookCopyRepository;
    this.#bookRepository = bookRepository;
    this.#inventoryRepository = inventoryRepository;
    this.#userService = userService;
    this.#unitOfWork = unitOfWork;
  }

  async getAll({ page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;
    const [rows, total] = await Promise.all([
      this.#purchaseRepository.findAll({ limit, offset }),
      this.#purchaseRepository.count(),
    ]);

    return {
      data: rows.map((row) => new PurchaseResponseDto(row)),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getById(id, executor) {
    const row = await this.#purchaseRepository.findById(id, executor);
    if (!row) {
      throw new NotFoundError('Compra no encontrada');
    }
    return new PurchaseResponseDto(row);
  }

  async getClientPurchases(clientId, { page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;
    const [rows, total] = await Promise.all([
      this.#purchaseRepository.findAll({ clientId, limit, offset }),
      this.#purchaseRepository.count({ clientId }),
    ]);

    return {
      data: rows.map((row) => new PurchaseResponseDto(row)),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // Si un cliente solicita una compra inexistente o de otro cliente, devuelve 404.
  async getClientPurchaseById(clientId, purchaseId) {
    const row = await this.#purchaseRepository.findById(purchaseId);
    if (!row || Number(row.client_id) !== Number(clientId)) {
      throw new NotFoundError('Compra no encontrada');
    }
    return new PurchaseResponseDto(row);
  }

  async create(adminId, purchaseCreateDto) {
    return this.#unitOfWork.execute(async (connection) => {
      const { clientId, temporaryPassword } = await this.#resolveClient(
        purchaseCreateDto,
        connection
      );

      let totalCents = 0;
      const detailsToInsert = [];

      for (const item of purchaseCreateDto.items) {
        const book = await this.#bookRepository.findById(item.bookId, connection);
        if (!book) {
          throw new NotFoundError(`El libro con id ${item.bookId} no existe`);
        }

        const lockedCopies = await this.#bookCopyRepository.lockAvailableByBookId(
          item.bookId,
          item.quantity,
          connection
        );

        if (lockedCopies.length < item.quantity) {
          throw new AppError(
            `Stock insuficiente para el libro "${book.title}". Disponible: ${lockedCopies.length}, solicitado: ${item.quantity}`,
            409,
            {
              bookId: book.book_id,
              title: book.title,
              requested: item.quantity,
              available: lockedCopies.length,
            }
          );
        }

        const copyIds = lockedCopies.map((copy) => copy.copy_id);
        await this.#bookCopyRepository.updateStatusByIds(copyIds, 'Sold', connection);
        await this.#inventoryRepository.adjustAvailableStock(
          item.bookId,
          -item.quantity,
          connection
        );

        // Snapshot del precio actual del libro y cálculo en centavos enteros para evitar errores IEEE 754.
        const unitPriceCents = Math.round(Number(book.sale_price) * 100);
        const unitPriceSnapshot = (unitPriceCents / 100).toFixed(2);
        totalCents += unitPriceCents * item.quantity;

        detailsToInsert.push({
          bookId: item.bookId,
          quantity: item.quantity,
          unitPrice: unitPriceSnapshot,
        });
      }

      const totalAmount = (totalCents / 100).toFixed(2);

      const purchaseId = await this.#purchaseRepository.createPurchase(
        {
          totalAmount,
          clientId,
          adminId,
        },
        connection
      );

      await this.#purchaseRepository.createPurchaseDetails(
        purchaseId,
        detailsToInsert,
        connection
      );

      const purchaseRow = await this.#purchaseRepository.findById(purchaseId, connection);
      return new PurchaseResponseDto(purchaseRow, temporaryPassword);
    });
  }

  async #resolveClient(purchaseCreateDto, connection) {
    if (purchaseCreateDto.client) {
      const createdUserDto = await this.#userService.create(
        purchaseCreateDto.client,
        connection
      );
      const serialized = createdUserDto.toJSON();
      return {
        clientId: serialized.id,
        temporaryPassword: serialized.temporaryPassword,
      };
    }

    await this.#userService.assertClientExists(purchaseCreateDto.clientId, connection);
    return {
      clientId: purchaseCreateDto.clientId,
      temporaryPassword: undefined,
    };
  }
}
