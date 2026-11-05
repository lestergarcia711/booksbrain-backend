import { Router } from 'express';
import { validateRequest } from '../middlewares/validateRequest.middleware.js';
import {
  bookCopyIdRules,
  createBookCopyRules,
  listBookCopyRules,
  updateBookCopyRules,
} from '../validators/bookCopy.validator.js';

// Encapsula el enrutador administrativo de ejemplares físicos (/api/v1/book-copies).
export default class BookCopyRouter {
  #router;
  #bookCopyController;

  constructor(bookCopyController) {
    this.#router = Router();
    this.#bookCopyController = bookCopyController;
    this.#initializeRoutes();
  }

  get router() {
    return this.#router;
  }

  #initializeRoutes() {
    this.#router.get('/', listBookCopyRules, validateRequest, this.#bookCopyController.getAll);
    this.#router.get('/:id', bookCopyIdRules, validateRequest, this.#bookCopyController.getById);
    this.#router.post('/', createBookCopyRules, validateRequest, this.#bookCopyController.create);
    this.#router.patch(
      '/:id',
      updateBookCopyRules,
      validateRequest,
      this.#bookCopyController.update
    );
    this.#router.delete(
      '/:id',
      bookCopyIdRules,
      validateRequest,
      this.#bookCopyController.delete
    );
  }
}
