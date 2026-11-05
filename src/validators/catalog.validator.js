import { param, query } from 'express-validator';
import { paginationRules } from './pagination.validator.js';

// Encapsula las reglas de validación para filtros, ordenamiento por lista blanca y paginación del catálogo público.
export default class CatalogValidator {
  #allowedSortBy;
  #allowedOrder;

  constructor() {
    this.#allowedSortBy = ['title', 'salePrice'];
    this.#allowedOrder = ['asc', 'desc'];
  }

  get listRules() {
    return [
      ...paginationRules,
      query('search')
        .optional()
        .trim()
        .isLength({ min: 1, max: 150 })
        .withMessage('search debe tener entre 1 y 150 caracteres'),
      query('categoryId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('categoryId debe ser un entero positivo')
        .toInt(),
      query('authorId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('authorId debe ser un entero positivo')
        .toInt(),
      query('availableOnly')
        .optional()
        .isBoolean()
        .withMessage('availableOnly debe ser booleano (true o false)')
        .toBoolean(),
      query('sortBy')
        .optional()
        .isIn(this.#allowedSortBy)
        .withMessage(`sortBy debe ser uno de: ${this.#allowedSortBy.join(', ')}`),
      query('order')
        .optional()
        .toLowerCase()
        .isIn(this.#allowedOrder)
        .withMessage('order debe ser asc o desc'),
    ];
  }

  get idRules() {
    return [
      param('id')
        .isInt({ min: 1 })
        .withMessage('El id debe ser un entero positivo')
        .toInt(),
    ];
  }
}

export const catalogValidator = new CatalogValidator();
export const catalogListRules = catalogValidator.listRules;
export const catalogIdRules = catalogValidator.idRules;
