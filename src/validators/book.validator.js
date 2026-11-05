import { body, param } from 'express-validator';

const withOptional = (chain, optional) => (optional ? chain.optional() : chain);

// Mismas reglas para crear (todo obligatorio) y actualizar (todo opcional)
const buildBookRules = (optional) => [
  withOptional(body('title'), optional)
    .trim()
    .notEmpty().withMessage('El título es obligatorio')
    .isLength({ max: 150 }).withMessage('Máximo 150 caracteres'),

  withOptional(body('isbn'), optional)
    .trim()
    .isISBN().withMessage('ISBN inválido (debe ser ISBN-10 o ISBN-13)')
    .isLength({ max: 20 }).withMessage('Máximo 20 caracteres'),

  withOptional(body('salePrice'), optional)
    .isFloat({ min: 0, max: 99999999.99 }).withMessage('El precio debe ser un número entre 0 y 99999999.99')
    .bail() // si no es número, no tiene sentido evaluar los decimales
    .isDecimal({ decimal_digits: '0,2' }).withMessage('El precio admite máximo 2 decimales')
    .toFloat(),

  withOptional(body('categoryId'), optional)
    .isInt({ min: 1 }).withMessage('categoryId debe ser un entero positivo')
    .toInt(),

  withOptional(body('authorIds'), optional)
    .isArray({ min: 1, max: 10 }).withMessage('authorIds debe ser un arreglo de 1 a 10 elementos'),

  body('authorIds.*')
    .isInt({ min: 1 }).withMessage('Cada id de autor debe ser un entero positivo')
    .toInt(),
];

export const bookIdRules = [
  param('id').isInt({ min: 1 }).withMessage('El id debe ser un entero positivo').toInt(),
];

export const createBookRules = buildBookRules(false);
export const updateBookRules = [...bookIdRules, ...buildBookRules(true)];