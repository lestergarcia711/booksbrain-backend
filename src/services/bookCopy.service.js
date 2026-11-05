import BookCopyResponseDto from '../dtos/bookCopies/bookCopy.response.dto.js';
import { BadRequestError, ConflictError, NotFoundError } from '../errors/http.errors.js';

// Coordina la gestión de ejemplares físicos (book_copies) y su impacto en el inventario mediante Unit of Work.
export default class BookCopyService {
  #bookCopyRepository;
  #bookRepository;
  #inventoryRepository;
  #unitOfWork;

  constructor(bookCopyRepository, bookRepository, inventoryRepository, unitOfWork) {
    this.#bookCopyRepository = bookCopyRepository;
    this.#bookRepository = bookRepository;
    this.#inventoryRepository = inventoryRepository;
    this.#unitOfWork = unitOfWork;
  }

  async getAll({ bookId, status, page, limit }) {
    const offset = (page - 1) * limit;
    const [rows, total] = await Promise.all([
      this.#bookCopyRepository.findAll({ bookId, status, limit, offset }),
      this.#bookCopyRepository.count({ bookId, status }),
    ]);

    return {
      data: rows.map((row) => new BookCopyResponseDto(row)),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getById(id, executor) {
    const row = await this.#bookCopyRepository.findById(id, executor);
    if (!row) {
      throw new NotFoundError('Ejemplar no encontrado');
    }
    return new BookCopyResponseDto(row);
  }

  async create(createDto) {
    return this.#unitOfWork.execute(async (connection) => {
      const book = await this.#bookRepository.findById(createDto.bookId, connection);
      if (!book) {
        throw new BadRequestError('El libro indicado no existe');
      }

      if (await this.#bookCopyRepository.findByBarcode(createDto.barcode, connection)) {
        throw new ConflictError('Ya existe un ejemplar con ese codigo de barras');
      }

      const newId = await this.#bookCopyRepository.create(
        {
          bookId: createDto.bookId,
          barcode: createDto.barcode,
          physicalCondition: createDto.physicalCondition,
          status: createDto.status,
        },
        connection
      );

      if (createDto.status === 'Available') {
        await this.#inventoryRepository.adjustAvailableStock(createDto.bookId, 1, connection);
      }

      return this.getById(newId, connection);
    });
  }

  async update(id, updateDto) {
    return this.#unitOfWork.execute(async (connection) => {
      const current = await this.#bookCopyRepository.findById(id, connection);
      if (!current) {
        throw new NotFoundError('Ejemplar no encontrado');
      }

      if (updateDto.barcode !== undefined) {
        const existing = await this.#bookCopyRepository.findByBarcode(
          updateDto.barcode,
          connection
        );
        if (existing && Number(existing.copy_id) !== Number(id)) {
          throw new ConflictError('Ya existe otro ejemplar con ese codigo de barras');
        }
      }

      await this.#bookCopyRepository.update(id, updateDto.toObject(), connection);

      if (updateDto.status !== undefined && updateDto.status !== current.status) {
        if (current.status !== 'Available' && updateDto.status === 'Available') {
          await this.#inventoryRepository.adjustAvailableStock(current.book_id, 1, connection);
        } else if (current.status === 'Available' && updateDto.status !== 'Available') {
          await this.#inventoryRepository.adjustAvailableStock(current.book_id, -1, connection);
        }
      }

      return this.getById(id, connection);
    });
  }

  async delete(id) {
    return this.#unitOfWork.execute(async (connection) => {
      const current = await this.#bookCopyRepository.findById(id, connection);
      if (!current) {
        throw new NotFoundError('Ejemplar no encontrado');
      }

      await this.#bookCopyRepository.delete(id, connection);

      if (current.status === 'Available') {
        await this.#inventoryRepository.adjustAvailableStock(current.book_id, -1, connection);
      }
    });
  }
}
