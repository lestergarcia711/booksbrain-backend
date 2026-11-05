import { validationResult } from 'express-validator';
import { BadRequestError } from '../errors/http.errors.js';

// Evalúa los resultados de express-validator y lanza BadRequestError (400) si hay errores.
export default class ValidateRequestMiddleware {
  validate = (req, res, next) => {
    const result = validationResult(req);
    if (result.isEmpty()) {
      return next();
    }

    throw new BadRequestError(
      result.array().map((e) => ({ field: e.path, message: e.msg }))
    );
  };
}

export const validateRequestMiddleware = new ValidateRequestMiddleware();
export const validateRequest = validateRequestMiddleware.validate;
