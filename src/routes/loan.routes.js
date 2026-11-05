import { Router } from 'express';
import { validateRequest } from '../middlewares/validateRequest.middleware.js';
import {
  createLoanRules,
  listLoanRules,
  loanIdRules,
  returnLoanRules,
} from '../validators/loan.validator.js';

// Encapsula el enrutador administrativo de préstamos y devoluciones (/api/v1/loans).
export default class LoanRouter {
  #router;
  #loanController;

  constructor(loanController) {
    this.#router = Router();
    this.#loanController = loanController;
    this.#initializeRoutes();
  }

  get router() {
    return this.#router;
  }

  #initializeRoutes() {
    this.#router.get('/', listLoanRules, validateRequest, this.#loanController.getAll);
    this.#router.get('/:id', loanIdRules, validateRequest, this.#loanController.getById);
    this.#router.post('/', createLoanRules, validateRequest, this.#loanController.create);
    this.#router.post(
      '/:id/return',
      returnLoanRules,
      validateRequest,
      this.#loanController.returnCopies
    );
    this.#router.patch(
      '/:id/return',
      returnLoanRules,
      validateRequest,
      this.#loanController.returnCopies
    );
  }
}
