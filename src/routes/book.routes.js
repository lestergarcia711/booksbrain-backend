import { Router } from 'express';
import { validateRequest } from '../middlewares/validateRequest.middleware.js';
import { paginationRules } from '../validators/pagination.validator.js';
import { bookIdRules, createBookRules, updateBookRules } from '../validators/book.validator.js';

export default function createBookRouter(bookController) {
  const router = Router();

  router.get('/', paginationRules, validateRequest, bookController.getAll);
  router.get('/:id', bookIdRules, validateRequest, bookController.getById);
  router.post('/', createBookRules, validateRequest, bookController.create);
  router.patch('/:id', updateBookRules, validateRequest, bookController.update);
  router.delete('/:id', bookIdRules, validateRequest, bookController.delete);

  return router;
}