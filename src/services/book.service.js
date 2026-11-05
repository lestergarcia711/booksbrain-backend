import BookResponseDto from '../dtos/books/book.response.dto.js';
import { BadRequestError, ConflictError, NotFoundError } from '../errors/http.errors.js';

export default class BookService {
  #bookRepository;
  #categoryRepository;
  #authorRepository;

  // Tres dependencias inyectadas: este service coordina datos de tres módulos
  constructor(bookRepository, categoryRepository, authorRepository) {
    this.#bookRepository = bookRepository;
    this.#categoryRepository = categoryRepository;
    this.#authorRepository = authorRepository;
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

  async getById(id) {
    const row = await this.#bookRepository.findById(id);
    if (!row) throw new NotFoundError('Libro no encontrado');
    return new BookResponseDto(row);
  }

  async create(createDto) {
    await this.#assertCategoryExists(createDto.categoryId);
    await this.#assertAuthorsExist(createDto.authorIds);
    await this.#assertIsbnAvailable(createDto.isbn);

    const newId = await this.#bookRepository.create({
      title: createDto.title,
      isbn: createDto.isbn,
      salePrice: createDto.salePrice,
      categoryId: createDto.categoryId,
      authorIds: createDto.authorIds,
    });

    return this.getById(newId);
  }

  async update(id, updateDto) {
    await this.getById(id); // 404 si no existe

    if (updateDto.categoryId !== undefined) await this.#assertCategoryExists(updateDto.categoryId);
    if (updateDto.authorIds !== undefined) await this.#assertAuthorsExist(updateDto.authorIds);
    if (updateDto.isbn !== undefined) await this.#assertIsbnAvailable(updateDto.isbn, id);

    await this.#bookRepository.update(id, {
      fields: updateDto.toObject(),
      authorIds: updateDto.authorIds,
    });

    return this.getById(id);
  }

  async delete(id) {
    await this.getById(id);

    await this.#bookRepository.delete(id);
  }


  async #assertCategoryExists(categoryId) {
    if (!(await this.#categoryRepository.findById(categoryId))) {
      throw new BadRequestError('La categoría indicada no existe');
    }
  }

  async #assertAuthorsExist(authorIds) {
    const found = await this.#authorRepository.findByIds(authorIds);
    const foundIds = new Set(found.map((author) => author.author_id));
    const missing = authorIds.filter((id) => !foundIds.has(id));
    if (missing.length > 0) {
      throw new BadRequestError(`Autores inexistentes: ${missing.join(', ')}`);
    }
  }

  // ignoreBookId: al actualizar, el ISBN "repetido" puede ser el del propio libro
  async #assertIsbnAvailable(isbn, ignoreBookId = null) {
    const existing = await this.#bookRepository.findByIsbn(isbn);
    if (existing && existing.book_id !== ignoreBookId) {
      throw new ConflictError('Ya existe un libro con ese ISBN');
    }
  }
}