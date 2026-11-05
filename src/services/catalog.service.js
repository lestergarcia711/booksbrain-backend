import CatalogBookResponseDto from '../dtos/catalog/catalogBook.response.dto.js';
import { NotFoundError } from '../errors/http.errors.js';

// Gestiona el catálogo público de solo lectura ocultando datos sensibles o administrativos.
export default class CatalogService {
  #bookRepository;

  constructor(bookRepository) {
    this.#bookRepository = bookRepository;
  }

  async getCatalog({ search, categoryId, authorId, availableOnly, sortBy = 'title', order = 'asc', page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;
    const [rows, total] = await Promise.all([
      this.#bookRepository.findCatalog({
        search,
        categoryId,
        authorId,
        availableOnly,
        sortBy,
        order,
        limit,
        offset,
      }),
      this.#bookRepository.countCatalog({
        search,
        categoryId,
        authorId,
        availableOnly,
      }),
    ]);

    return {
      data: rows.map((row) => new CatalogBookResponseDto(row)),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getById(id) {
    const row = await this.#bookRepository.findById(id);
    if (!row) {
      throw new NotFoundError('Libro no encontrado en el catalogo');
    }
    return new CatalogBookResponseDto(row);
  }
}
