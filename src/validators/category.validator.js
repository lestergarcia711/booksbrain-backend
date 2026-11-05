import { body, param } from 'express-validator';

// Encapsula las reglas de validación para categorías.
export default class CategoryValidator {
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
      body('name')
        .trim()
        .notEmpty()
        .withMessage('El nombre es obligatorio')
        .isLength({ max: 50 })
        .withMessage('Maximo 50 caracteres'),
    ];
  }
}

export const categoryValidator = new CategoryValidator();
export const categoryIdRules = categoryValidator.idRules;
export const categoryBodyRules = categoryValidator.bodyRules;
