import { Router } from 'express';
import { validateRequest } from '../middlewares/validateRequest.middleware.js';
import {
  createUserRules,
  paginationRules,
  updateUserRules,
  userIdRules,
} from '../validators/user.validator.js';

// Encapsula el enrutador administrativo de usuarios mediante programación orientada a objetos.
export default class UserRouter {
  #router;
  #userController;

  constructor(userController) {
    this.#router = Router();
    this.#userController = userController;
    this.#initializeRoutes();
  }

  get router() {
    return this.#router;
  }

  #initializeRoutes() {
    this.#router.get('/', paginationRules, validateRequest, this.#userController.getAll);
    this.#router.get('/:id', userIdRules, validateRequest, this.#userController.getById);
    this.#router.post('/', createUserRules, validateRequest, this.#userController.create);
    this.#router.patch('/:id', updateUserRules, validateRequest, this.#userController.update);
    this.#router.delete('/:id', userIdRules, validateRequest, this.#userController.delete);
  }
}
