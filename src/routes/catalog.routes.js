import { Router } from 'express';
import { validateRequest } from '../middlewares/validateRequest.middleware.js';
import { catalogIdRules, catalogListRules } from '../validators/catalog.validator.js';

// Encapsula el enrutador del catálogo público (/api/v1/catalog) con rate limiting específico.
export default class CatalogRouter {
  #router;
  #catalogController;
  #rateLimitMiddleware;

  constructor({ catalogController, rateLimitMiddleware }) {
    this.#router = Router();
    this.#catalogController = catalogController;
    this.#rateLimitMiddleware = rateLimitMiddleware;
    this.#initializeRoutes();
  }

  get router() {
    return this.#router;
  }

  #initializeRoutes() {
    this.#router.use(this.#rateLimitMiddleware.catalogLimiter);
    this.#router.get('/', catalogListRules, validateRequest, this.#catalogController.getCatalog);
    this.#router.get('/:id', catalogIdRules, validateRequest, this.#catalogController.getById);
  }
}
