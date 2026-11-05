import { Router } from 'express';
import { validateRequest } from '../middlewares/validateRequest.middleware.js';
import { listLoanRules, loanIdRules } from '../validators/loan.validator.js';
import { listPurchaseRules, purchaseIdRules } from '../validators/purchase.validator.js';

// Encapsula el enrutador personal del cliente autenticado (/api/v1/me/*).
export default class MeRouter {
  #router;
  #meController;

  constructor(meController) {
    this.#router = Router();
    this.#meController = meController;
    this.#initializeRoutes();
  }

  get router() {
    return this.#router;
  }

  #initializeRoutes() {
    this.#router.get(
      '/loans',
      listLoanRules,
      validateRequest,
      this.#meController.getMyLoans
    );
    this.#router.get(
      '/loans/:id',
      loanIdRules,
      validateRequest,
      this.#meController.getMyLoanById
    );
    this.#router.get(
      '/purchases',
      listPurchaseRules,
      validateRequest,
      this.#meController.getMyPurchases
    );
    this.#router.get(
      '/purchases/:id',
      purchaseIdRules,
      validateRequest,
      this.#meController.getMyPurchaseById
    );
  }
}
