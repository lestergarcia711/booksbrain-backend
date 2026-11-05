import { Router } from 'express';
import { validateRequest } from '../middlewares/validateRequest.middleware.js';
import {
  createUserRules,
  paginationRules,
  updateUserRules,
  userIdRules,
} from '../validators/user.validator.js';

export default function createUserRouter(userController) {
  const router = Router();

  router.get('/', paginationRules, validateRequest, userController.getAll);
  router.get('/:id', userIdRules, validateRequest, userController.getById);
  router.post('/', createUserRules, validateRequest, userController.create);
  router.patch('/:id', updateUserRules, validateRequest, userController.update);
  router.delete('/:id', userIdRules, validateRequest, userController.delete);

  return router;
}