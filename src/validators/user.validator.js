import { body, param, query } from 'express-validator';

// cuando haga validaciones debo tener en cuenta que lo opcional va primero en la cadena.

const withOptional = (chain, optional) => (optional ? chain.optional(): chain);

const fullNameRule = (optional)=>
    withOptional(body('fullName'), optional)
       .trim()
       .notEmpty().withMessage('El nombre completo es obligatorio')
       .isLength({ max:100}).withMessage('Maximo 100 caracteres');

const emailRule = (optional)=>
    withOptional(body('email'), optional)
        .trim()
        .toLowerCase()
        .isEmail().withMessage('Correo electronico invalido')
        .isLength({ max: 100}).withMessage('Maximo 100 caracteres');


const phoneRule = () =>
  body('phone')
    .optional({ values: 'null' })
    .trim()
    .isLength({ max: 20 }).withMessage('Máximo 20 caracteres');

const addressRule = () =>
  body('address')
    .optional({ values: 'null' })
    .trim()
    .isLength({ max: 150 }).withMessage('Máximo 150 caracteres');


export const userIdRules = [
  param('id').isInt({ min:1}).withMessage('El id debe ser un entero positivo').toInt()

];

export const paginationRules = [
  query('page').optional().isInt({ min: 1 }).withMessage('page debe ser >= 1').toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit debe estar entre 1 y 100').toInt(),
];

export const createUserRules = [
    body('idCard')
     .trim()
     .notEmpty().withMessage('La identificacion es obligatoria')
     .isNumeric({ no_symbols: true}).withMessage('La identificacion debe contener solo numeros')
     .isLength({ max: 20}).withMessage('Maximo 20 caracteres'),
    fullNameRule(false),
    emailRule(false),
    phoneRule(),
    addressRule(),
    body('password')
        .isLength({ min: 8, max: 64}).withMessage('La contrasenia debe tener entre 8 y 64 carateres')
        .matches(/[A-Za-z]/).withMessage('Debe contener al menos una letra')
        .matches(/\d/).withMessage('Debe contener al menos un numero'),
    body('roleId')
         .isInt({ min: 1}).withMessage('roleId debe ser un entero positivo')
         .toInt(),
];

export const updateUserRules = [
  ...userIdRules,
  fullNameRule(true),
  emailRule(true),
  phoneRule(),
  addressRule(),
];