import { body } from 'express-validator';

// Encapsula las reglas de validación para autenticación y cambio de contraseña.
export default class AuthValidator {
  get loginRules() {
    return [
      body('email')
        .trim()
        .toLowerCase()
        .isEmail()
        .withMessage('Correo electronico invalido')
        .isLength({ max: 100 })
        .withMessage('Maximo 100 caracteres'),
      body('password')
        .isString()
        .withMessage('La contrasenia es obligatoria')
        .notEmpty()
        .withMessage('La contrasenia es obligatoria'),
    ];
  }

  get passwordUpdateRules() {
    return [
      body('currentPassword')
        .isString()
        .withMessage('La contrasenia actual es obligatoria')
        .notEmpty()
        .withMessage('La contrasenia actual es obligatoria'),
      body('newPassword')
        .isString()
        .withMessage('La nueva contrasenia es obligatoria')
        .isLength({ min: 8, max: 64 })
        .withMessage('La nueva contrasenia debe tener entre 8 y 64 caracteres')
        .matches(/[A-Za-z]/)
        .withMessage('Debe contener al menos una letra')
        .matches(/\d/)
        .withMessage('Debe contener al menos un numero')
        .custom((value, { req }) => value !== req.body?.currentPassword)
        .withMessage('La nueva contrasenia debe ser diferente a la actual'),
    ];
  }
}

export const authValidator = new AuthValidator();
export const loginRules = authValidator.loginRules;
export const passwordUpdateRules = authValidator.passwordUpdateRules;
