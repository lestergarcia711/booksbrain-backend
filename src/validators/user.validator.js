import { body, param } from 'express-validator';
import { paginationRules } from './pagination.validator.js';

// Encapsula las reglas de validación para usuarios y creación de clientes (standalone e inline).
export default class UserValidator {
  #withOptional(chain, optional) {
    return optional ? chain.optional() : chain;
  }

  #fullNameRule(fieldPath, optional) {
    return this.#withOptional(body(fieldPath), optional)
      .trim()
      .notEmpty()
      .withMessage('El nombre completo es obligatorio')
      .isLength({ max: 100 })
      .withMessage('Maximo 100 caracteres');
  }

  #emailRule(fieldPath, optional) {
    return this.#withOptional(body(fieldPath), optional)
      .trim()
      .toLowerCase()
      .isEmail()
      .withMessage('Correo electronico invalido')
      .isLength({ max: 100 })
      .withMessage('Maximo 100 caracteres');
  }

  #phoneRule(fieldPath) {
    return body(fieldPath)
      .optional({ values: 'null' })
      .trim()
      .isLength({ max: 20 })
      .withMessage('Maximo 20 caracteres');
  }

  #addressRule(fieldPath) {
    return body(fieldPath)
      .optional({ values: 'null' })
      .trim()
      .isLength({ max: 150 })
      .withMessage('Maximo 150 caracteres');
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
    return [
      body('idCard')
        .trim()
        .notEmpty()
        .withMessage('La identificacion es obligatoria')
        .isNumeric({ no_symbols: true })
        .withMessage('La identificacion debe contener solo numeros')
        .isLength({ max: 20 })
        .withMessage('Maximo 20 caracteres'),
      this.#fullNameRule('fullName', false),
      this.#emailRule('email', false),
      this.#phoneRule('phone'),
      this.#addressRule('address'),
      // Se prohíbe recibir roleId o password en el body de POST /users (deuda técnica resuelta).
      body('roleId')
        .custom((value) => value === undefined)
        .withMessage('No esta permitido enviar roleId en el cuerpo de la peticion'),
    ];
  }

  get updateRules() {
    return [
      ...this.idRules,
      this.#fullNameRule('fullName', true),
      this.#emailRule('email', true),
      this.#phoneRule('phone'),
      this.#addressRule('address'),
    ];
  }

  // Reglas reutilizables para validar clientId XOR objeto client inline en préstamos y compras.
  get inlineClientXorRules() {
    return [
      body().custom((bodyValue) => {
        const hasClientId = bodyValue?.clientId !== undefined && bodyValue?.clientId !== null;
        const hasClientObj =
          bodyValue?.client !== undefined &&
          bodyValue?.client !== null &&
          typeof bodyValue.client === 'object' &&
          !Array.isArray(bodyValue.client);

        if ((hasClientId && hasClientObj) || (!hasClientId && !hasClientObj)) {
          throw new Error('Debes enviar exactamente uno: clientId o el objeto client (XOR)');
        }
        return true;
      }),
      body('clientId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('clientId debe ser un entero positivo')
        .toInt(),
      body('client.idCard')
        .if(body('client').exists())
        .trim()
        .notEmpty()
        .withMessage('La identificacion del cliente es obligatoria')
        .isNumeric({ no_symbols: true })
        .withMessage('La identificacion del cliente debe contener solo numeros')
        .isLength({ max: 20 })
        .withMessage('Maximo 20 caracteres'),
      body('client.fullName')
        .if(body('client').exists())
        .trim()
        .notEmpty()
        .withMessage('El nombre completo del cliente es obligatorio')
        .isLength({ max: 100 })
        .withMessage('Maximo 100 caracteres'),
      body('client.email')
        .if(body('client').exists())
        .trim()
        .toLowerCase()
        .isEmail()
        .withMessage('Correo electronico del cliente invalido')
        .isLength({ max: 100 })
        .withMessage('Maximo 100 caracteres'),
      this.#phoneRule('client.phone').if(body('client').exists()),
      this.#addressRule('client.address').if(body('client').exists()),
    ];
  }
}

export const userValidator = new UserValidator();
export const userIdRules = userValidator.idRules;
export const createUserRules = userValidator.createRules;
export const updateUserRules = userValidator.updateRules;
export { paginationRules };
