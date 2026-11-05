import { body, param } from 'express-validator';
import { paginationRules } from './pagination.validator.js';
import { userValidator } from './user.validator.js';

// Encapsula las reglas de validación para compras presenciales.
export default class PurchaseValidator {
  get idRules() {
    return [
      param('id')
        .isInt({ min: 1 })
        .withMessage('El id debe ser un entero positivo')
        .toInt(),
    ];
  }

  get listRules() {
    return [...paginationRules];
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
      body('items')
        .isArray({ min: 1, max: 50 })
        .withMessage('items debe ser un arreglo de 1 a 50 elementos'),
      body('items.*.bookId')
        .isInt({ min: 1 })
        .withMessage('Cada bookId debe ser un entero positivo')
        .toInt(),
      body('items.*.quantity')
        .isInt({ min: 1, max: 100 })
        .withMessage('quantity debe ser un entero positivo entre 1 y 100')
        .toInt(),
    ];
  }
}

export const purchaseValidator = new PurchaseValidator();
export const purchaseIdRules = purchaseValidator.idRules;
export const listPurchaseRules = purchaseValidator.listRules;
export const createPurchaseRules = purchaseValidator.createRules;
