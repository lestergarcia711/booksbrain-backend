import { Router } from 'express';
import { validateRequest } from '../middlewares/validateRequest.middleware.js';
import { paginationRules } from '../validators/pagination.validator.js';
import { bookIdRules, createBookRules, updateBookRules } from '../validators/book.validator.js';

// Encapsula el enrutador administrativo de libros mediante programación orientada a objetos.
export default class BookRouter {
  #router;
  #bookController;

  constructor(bookController) {
    this.#router = Router();
    this.#bookController = bookController;
    this.#initializeRoutes();
  }

  get router() {
    return this.#router;
  }

  #initializeRoutes() {
    this.#router.get('/', paginationRules, validateRequest, this.#bookController.getAll);
    this.#router.get('/:id', bookIdRules, validateRequest, this.#bookController.getById);
    this.#router.post('/', createBookRules, validateRequest, this.#bookController.create);
    this.#router.patch('/:id', updateBookRules, validateRequest, this.#bookController.update);
    this.#router.delete('/:id', bookIdRules, validateRequest, this.#bookController.delete);
  }
}
