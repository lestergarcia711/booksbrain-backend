import { query } from 'express-validator';

// Encapsula las reglas reutilizables de paginación con tope máximo.
export default class PaginationValidator {
  get rules() {
    return [
      query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('page debe ser >= 1')
        .toInt(),
      query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('limit debe estar entre 1 y 100')
        .toInt(),
    ];
  }
}

export const paginationValidator = new PaginationValidator();
export const paginationRules = paginationValidator.rules;
