import { matchedData } from 'express-validator';

// Controla las peticiones HTTP de solo lectura del catálogo público (/api/v1/catalog).
export default class CatalogController {
  #catalogService;

  constructor(catalogService) {
    this.#catalogService = catalogService;
  }

  getCatalog = async (req, res) => {
    const {
      search,
      categoryId,
      authorId,
      availableOnly,
      sortBy = 'title',
      order = 'asc',
      page = 1,
      limit = 10,
    } = matchedData(req, { locations: ['query'] });

    const result = await this.#catalogService.getCatalog({
      search,
      categoryId,
      authorId,
      availableOnly,
      sortBy,
      order,
      page,
      limit,
    });

    res.status(200).json({ status: 'success', ...result });
  };

  getById = async (req, res) => {
    const { id } = matchedData(req, { locations: ['params'] });
    const data = await this.#catalogService.getById(id);
    res.status(200).json({ status: 'success', data });
  };
}
