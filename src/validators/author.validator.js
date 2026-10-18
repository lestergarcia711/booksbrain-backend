import {body, param} from 'express-validator';

export const authorIdRules = [
    param('id').isInt({ min: 1}).withMessage('El id debe ser un entero positivo')
];



export const authorBodyRules = [
    body('fullName')
    .trim()
    .notEmpty().withMessage('El nombre es obligatorio')
    .isLength({max: 100}).withMessage('Maximo 100 caracteres'),

];