import { body, param } from 'express-validator';

// Encapsula las reglas de validación para autores.
export default class AuthorValidator {
  get idRules() {
    return [
      param('id')
        .isInt({ min: 1 })
        .withMessage('El id debe ser un entero positivo')
        .toInt(),
    ];
  }

  get bodyRules() {
    return [
      body('fullName')
        .trim()
        .notEmpty()
        .withMessage('El nombre es obligatorio')
        .isLength({ max: 100 })
        .withMessage('Maximo 100 caracteres'),
    ];
  }
}

export const authorValidator = new AuthorValidator();
export const authorIdRules = authorValidator.idRules;
export const authorBodyRules = authorValidator.bodyRules;
