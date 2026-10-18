import {body, param} from 'express-validator';

export const categoryIdRules = [
    param('id').isInt({ min: 1}).withMessage('El id debe ser un entero positivo')
];



export const categoryBodyRules = [
    body('name')
    .trim()
    .notEmpty().withMessage('El nombre es obligatorio')
    .isLength({max: 50}).withMessage('Maximo 50 caracteres'),

];