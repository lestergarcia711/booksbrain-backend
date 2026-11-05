import { Router } from 'express';
import { validateRequest } from '../middlewares/validateRequest.middleware.js';
import {
  createPurchaseRules,
  listPurchaseRules,
  purchaseIdRules,
} from '../validators/purchase.validator.js';

// Encapsula el enrutador administrativo de ventas presenciales (/api/v1/purchases).
export default class PurchaseRouter {
  #router;
  #purchaseController;

  constructor(purchaseController) {
    this.#router = Router();
    this.#purchaseController = purchaseController;
    this.#initializeRoutes();
  }

  get router() {
    return this.#router;
  }

  #initializeRoutes() {
    this.#router.get('/', listPurchaseRules, validateRequest, this.#purchaseController.getAll);
    this.#router.get('/:id', purchaseIdRules, validateRequest, this.#purchaseController.getById);
    this.#router.post('/', createPurchaseRules, validateRequest, this.#purchaseController.create);
  }
}
