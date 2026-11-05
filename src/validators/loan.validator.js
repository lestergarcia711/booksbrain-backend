import { body, param, query } from 'express-validator';
import { paginationRules } from './pagination.validator.js';
import { userValidator } from './user.validator.js';

// Encapsula las reglas de validación para la creación, devolución y consulta de préstamos.
export default class LoanValidator {
  #validStatuses;

  constructor() {
    this.#validStatuses = ['Active', 'Returned', 'Overdue'];
  }

  get idRules() {
    return [
      param('id')
        .isInt({ min: 1 })
        .withMessage('El id debe ser un entero positivo')
        .toInt(),
    ];
  }

  get listRules() {
    return [
      ...paginationRules,
      query('status')
        .optional()
        .isIn(this.#validStatuses)
        .withMessage(`status debe ser uno de: ${this.#validStatuses.join(', ')}`),
    ];
  }

  get createRules() {
    return [
      // Prohibido enviar admin_id o adminId en el body (siempre sale del token).
      body('adminId')
        .custom((val) => val === undefined)
        .withMessage('No esta permitido enviar adminId en el body'),
      body('admin_id')
        .custom((val) => val === undefined)
        .withMessage('No esta permitido enviar admin_id en el body'),
      ...userValidator.inlineClientXorRules,
      body().custom((bodyValue) => {
        const hasCopyIds = Array.isArray(bodyValue?.copyIds) && bodyValue.copyIds.length > 0;
        const hasBookIds = Array.isArray(bodyValue?.bookIds) && bodyValue.bookIds.length > 0;
        if ((hasCopyIds && hasBookIds) || (!hasCopyIds && !hasBookIds)) {
          throw new Error('Debes enviar copyIds o bookIds (uno de los dos) con al menos un elemento');
        }
        return true;
      }),
      body('copyIds')
        .optional()
        .isArray({ min: 1, max: 20 })
        .withMessage('copyIds debe ser un arreglo de 1 a 20 elementos'),
      body('copyIds.*')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Cada copyId debe ser un entero positivo')
        .toInt(),
      body('bookIds')
        .optional()
        .isArray({ min: 1, max: 20 })
        .withMessage('bookIds debe ser un arreglo de 1 a 20 elementos'),
      body('bookIds.*')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Cada bookId debe ser un entero positivo')
        .toInt(),
      body('expectedReturnDate')
        .optional()
        .isISO8601({ strict: true })
        .withMessage('expectedReturnDate debe tener formato YYYY-MM-DD'),
    ];
  }

  get returnRules() {
    return [
      ...this.idRules,
      body('returns')
        .isArray({ min: 1, max: 20 })
        .withMessage('returns debe ser un arreglo de 1 a 20 ejemplares a devolver'),
      body('returns.*.copyId')
        .isInt({ min: 1 })
        .withMessage('Cada copyId debe ser un entero positivo')
        .toInt(),
      body('returns.*.checkinCondition')
        .trim()
        .notEmpty()
        .withMessage('checkinCondition es obligatorio para cada ejemplar devuelto')
        .isLength({ max: 100 })
        .withMessage('Maximo 100 caracteres'),
    ];
  }
}

export const loanValidator = new LoanValidator();
export const loanIdRules = loanValidator.idRules;
export const listLoanRules = loanValidator.listRules;
export const createLoanRules = loanValidator.createRules;
export const returnLoanRules = loanValidator.returnRules;
