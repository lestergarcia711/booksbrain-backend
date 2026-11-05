import { Router } from 'express';

// Encapsula el enrutador de roles mediante programación orientada a objetos.
export default class RoleRouter {
  #router;
  #roleController;

  constructor(roleController) {
    this.#router = Router();
    this.#roleController = roleController;
    this.#initializeRoutes();
  }

  get router() {
    return this.#router;
  }

  #initializeRoutes() {
    this.#router.get('/', this.#roleController.getAll);
  }
}
