import { ForbiddenError } from '../errors/http.errors.js';

// Protege contra ataques CSRF validando que la cabecera Origin pertenezca a CORS_ORIGINS en métodos mutadores.
export default class CsrfMiddleware {
  #allowedOrigins;
  #mutatingMethods;

  constructor(allowedOrigins) {
    this.#allowedOrigins = new Set(allowedOrigins);
    this.#mutatingMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
  }

  verifyOrigin = (req, res, next) => {
    if (!this.#mutatingMethods.has(req.method)) {
      return next();
    }

    const origin = req.get('origin');
    if (!origin || !this.#allowedOrigins.has(origin)) {
      return next(new ForbiddenError('Origen de peticion no permitido (proteccion CSRF)'));
    }

    return next();
  };
}
