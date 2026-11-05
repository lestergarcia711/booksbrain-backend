import { body, param, query } from 'express-validator';
import { paginationRules } from './pagination.validator.js';

// Encapsula las reglas de validación para los ejemplares físicos (book_copies).
export default class BookCopyValidator {
  #validStatuses;

  constructor() {
    this.#validStatuses = ['Available', 'Borrowed', 'Maintenance', 'Sold'];
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
      query('bookId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('bookId debe ser un entero positivo')
        .toInt(),
      query('status')
        .optional()
        .isIn(this.#validStatuses)
        .withMessage(`status debe ser uno de: ${this.#validStatuses.join(', ')}`),
    ];
  }

  get createRules() {
    return [
      body('bookId')
        .isInt({ min: 1 })
        .withMessage('bookId debe ser un entero positivo')
        .toInt(),
      body('barcode')
        .trim()
        .notEmpty()
        .withMessage('El codigo de barras es obligatorio')
        .isLength({ max: 50 })
        .withMessage('Maximo 50 caracteres'),
      body('physicalCondition')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('La condicion fisica no puede estar vacia')
        .isLength({ max: 50 })
        .withMessage('Maximo 50 caracteres'),
      body('status')
        .optional()
        .isIn(this.#validStatuses)
        .withMessage(`status debe ser uno de: ${this.#validStatuses.join(', ')}`),
    ];
  }

  get updateRules() {
    return [
      ...this.idRules,
      body('barcode')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('El codigo de barras no puede estar vacio')
        .isLength({ max: 50 })
        .withMessage('Maximo 50 caracteres'),
      body('physicalCondition')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('La condicion fisica no puede estar vacia')
        .isLength({ max: 50 })
        .withMessage('Maximo 50 caracteres'),
      body('status')
        .optional()
        .isIn(this.#validStatuses)
        .withMessage(`status debe ser uno de: ${this.#validStatuses.join(', ')}`),
    ];
  }
}

export const bookCopyValidator = new BookCopyValidator();
export const bookCopyIdRules = bookCopyValidator.idRules;
export const listBookCopyRules = bookCopyValidator.listRules;
export const createBookCopyRules = bookCopyValidator.createRules;
export const updateBookCopyRules = bookCopyValidator.updateRules;
