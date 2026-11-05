import { body, param } from 'express-validator';

// Encapsula las reglas de validación para libros.
export default class BookValidator {
  #withOptional(chain, optional) {
    return optional ? chain.optional() : chain;
  }

  #buildBookRules(optional) {
    return [
      this.#withOptional(body('title'), optional)
        .trim()
        .notEmpty()
        .withMessage('El titulo es obligatorio')
        .isLength({ max: 150 })
        .withMessage('Maximo 150 caracteres'),

      this.#withOptional(body('isbn'), optional)
        .trim()
        .isISBN()
        .withMessage('ISBN invalido (debe ser ISBN-10 o ISBN-13)')
        .isLength({ max: 20 })
        .withMessage('Maximo 20 caracteres'),

      this.#withOptional(body('salePrice'), optional)
        .isFloat({ min: 0, max: 99999999.99 })
        .withMessage('El precio debe ser un numero entre 0 y 99999999.99')
        .bail()
        .isDecimal({ decimal_digits: '0,2' })
        .withMessage('El precio admite maximo 2 decimales')
        .toFloat(),

      this.#withOptional(body('categoryId'), optional)
        .isInt({ min: 1 })
        .withMessage('categoryId debe ser un entero positivo')
        .toInt(),

      this.#withOptional(body('authorIds'), optional)
        .isArray({ min: 1, max: 10 })
        .withMessage('authorIds debe ser un arreglo de 1 a 10 elementos'),

      body('authorIds.*')
        .isInt({ min: 1 })
        .withMessage('Cada id de autor debe ser un entero positivo')
        .toInt(),
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

  get createRules() {
    return this.#buildBookRules(false);
  }

  get updateRules() {
    return [...this.idRules, ...this.#buildBookRules(true)];
  }
}

export const bookValidator = new BookValidator();
export const bookIdRules = bookValidator.idRules;
export const createBookRules = bookValidator.createRules;
export const updateBookRules = bookValidator.updateRules;
