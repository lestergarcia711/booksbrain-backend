import { NotFoundError } from '../errors/http.errors.js';

// Captura peticiones a rutas inexistentes y las transforma en NotFoundError (404).
export default class NotFoundMiddleware {
  handle = (req, res, next) => {
    next(new NotFoundError(`Ruta no encontrada: ${req.method} ${req.originalUrl}`));
  };
}

export const notFoundMiddleware = new NotFoundMiddleware();
export const notFoundHandler = notFoundMiddleware.handle;
