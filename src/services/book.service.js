import BookResponseDto from '../dtos/books/book.response.dto.js';
import { BadRequestError, ConflictError, NotFoundError } from '../errors/http.errors.js';

// Coordina el CRUD de libros e inicialización de inventario usando Unit of Work.
export default class BookService {
  #bookRepository;
  #categoryRepository;
  #authorRepository;
  #inventoryRepository;
  #unitOfWork;

  constructor(
    bookRepository,
    categoryRepository,
    authorRepository,
    inventoryRepository,
    unitOfWork
  ) {
    this.#bookRepository = bookRepository;
    this.#categoryRepository = categoryRepository;
    this.#authorRepository = authorRepository;
    this.#inventoryRepository = inventoryRepository;
    this.#unitOfWork = unitOfWork;
  }

  async getAll({ page, limit }) {
    const offset = (page - 1) * limit;
    const [rows, total] = await Promise.all([
      this.#bookRepository.findAll({ limit, offset }),
      this.#bookRepository.count(),
    ]);
    return {
      data: rows.map((row) => new BookResponseDto(row)),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getById(id, executor) {
    const row = await this.#bookRepository.findById(id, executor);
    if (!row) {
      throw new NotFoundError('Libro no encontrado');
    }
    return new BookResponseDto(row);
  }

  async create(createDto) {
    return this.#unitOfWork.execute(async (connection) => {
      await this.#assertCategoryExists(createDto.categoryId, connection);
      await this.#assertAuthorsExist(createDto.authorIds, connection);
      await this.#assertIsbnAvailable(createDto.isbn, null, connection);

      const newId = await this.#bookRepository.createRecord(
        {
          title: createDto.title,
          isbn: createDto.isbn,
          salePrice: createDto.salePrice,
          categoryId: createDto.categoryId,
        },
        connection
      );

      await this.#bookRepository.replaceAuthors(newId, createDto.authorIds, connection);
      await this.#inventoryRepository.createForBook(newId, 0, 5, connection);

      return this.getById(newId, connection);
    });
  }

  async update(id, updateDto) {
    return this.#unitOfWork.execute(async (connection) => {
      await this.getById(id, connection);

      if (updateDto.categoryId !== undefined) {
        await this.#assertCategoryExists(updateDto.categoryId, connection);
      }
      if (updateDto.authorIds !== undefined) {
        await this.#assertAuthorsExist(updateDto.authorIds, connection);
      }
      if (updateDto.isbn !== undefined) {
        await this.#assertIsbnAvailable(updateDto.isbn, id, connection);
      }

      await this.#bookRepository.updateFields(id, updateDto.toObject(), connection);

      if (updateDto.authorIds !== undefined) {
        await this.#bookRepository.replaceAuthors(id, updateDto.authorIds, connection);
      }

      return this.getById(id, connection);
    });
  }

  async delete(id) {
    await this.getById(id);
    await this.#bookRepository.delete(id);
  }

  async #assertCategoryExists(categoryId, executor) {
    if (!(await this.#categoryRepository.findById(categoryId, executor))) {
      throw new BadRequestError('La categoria indicada no existe');
    }
  }

  async #assertAuthorsExist(authorIds, executor) {
    const found = await this.#authorRepository.findByIds(authorIds, executor);
    const foundIds = new Set(found.map((author) => author.author_id));
    const missing = authorIds.filter((id) => !foundIds.has(id));
    if (missing.length > 0) {
      throw new BadRequestError(`Autores inexistentes: ${missing.join(', ')}`);
    }
  }

  async #assertIsbnAvailable(isbn, ignoreBookId = null, executor) {
    const existing = await this.#bookRepository.findByIsbn(isbn, executor);
    if (existing && Number(existing.book_id) !== Number(ignoreBookId)) {
      throw new ConflictError('Ya existe un libro con ese ISBN');
    }
  }
}
