import { Router } from 'express';
import { validateRequest } from '../middlewares/validateRequest.middleware.js';
import { categoryBodyRules, categoryIdRules } from '../validators/category.validator.js';

// Encapsula el enrutador de categorías mediante programación orientada a objetos.
export default class CategoryRouter {
  #router;
  #categoryController;

  constructor(categoryController) {
    this.#router = Router();
    this.#categoryController = categoryController;
    this.#initializeRoutes();
  }

  get router() {
    return this.#router;
  }

  #initializeRoutes() {
    this.#router.get('/', this.#categoryController.getAll);
    this.#router.get('/:id', categoryIdRules, validateRequest, this.#categoryController.getById);
    this.#router.post('/', categoryBodyRules, validateRequest, this.#categoryController.create);
    this.#router.put(
      '/:id',
      categoryIdRules,
      categoryBodyRules,
      validateRequest,
      this.#categoryController.update
    );
    this.#router.delete(
      '/:id',
      categoryIdRules,
      validateRequest,
      this.#categoryController.delete
    );
  }
}
