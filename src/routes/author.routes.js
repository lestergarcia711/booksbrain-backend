import { Router } from 'express';
import { validateRequest } from '../middlewares/validateRequest.middleware.js';
import { authorBodyRules, authorIdRules } from '../validators/author.validator.js';

// Encapsula el enrutador de autores mediante programación orientada a objetos.
export default class AuthorRouter {
  #router;
  #authorController;

  constructor(authorController) {
    this.#router = Router();
    this.#authorController = authorController;
    this.#initializeRoutes();
  }

  get router() {
    return this.#router;
  }

  #initializeRoutes() {
    this.#router.get('/', this.#authorController.getAll);
    this.#router.get('/:id', authorIdRules, validateRequest, this.#authorController.getById);
    this.#router.post('/', authorBodyRules, validateRequest, this.#authorController.create);
    this.#router.put(
      '/:id',
      authorIdRules,
      authorBodyRules,
      validateRequest,
      this.#authorController.update
    );
    this.#router.delete(
      '/:id',
      authorIdRules,
      validateRequest,
      this.#authorController.delete
    );
  }
}
