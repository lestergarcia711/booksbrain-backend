import { AppError } from '../errors/http.errors.js';
import { env } from '../config/env.config.js';

// Gestiona de forma centralizada todos los errores de la aplicación y de MySQL.
export default class ErrorHandlerMiddleware {
  #mysqlErrors;
  #isProduction;

  constructor(nodeEnv = env.nodeEnv) {
    this.#isProduction = nodeEnv === 'production';
    this.#mysqlErrors = {
      ER_DUP_ENTRY: {
        status: 409,
        message: 'Ya existe un registro con esos datos unicos',
      },
      ER_NO_REFERENCED_ROW_2: {
        status: 400,
        message: 'Referencia invalida: No existe ningun registro con esa referencia',
      },
      ER_ROW_IS_REFERENCED_2: {
        status: 409,
        message: 'No se puede eliminar: tiene registros asociados',
      },
      ER_LOCK_DEADLOCK: {
        status: 409,
        message: 'Conflicto de concurrencia al procesar la operacion',
      },
      ER_LOCK_WAIT_TIMEOUT: {
        status: 409,
        message: 'Tiempo de espera agotado por bloqueo de concurrencia',
      },
    };
  }

  handle = (err, req, res, next) => {
    let statusCode = 500;
    let message = 'Error interno del servidor';
    let details;

    if (err instanceof AppError) {
      ({ statusCode, message, details } = err);
    } else if (this.#mysqlErrors[err.code]) {
      ({ status: statusCode, message } = this.#mysqlErrors[err.code]);
    } else if (err.type === 'entity.parse.failed') {
      statusCode = 400;
      message = 'Formato JSON mal formado';
    }

    if (statusCode === 500 && !this.#isProduction) {
      console.error(err);
    }

    res.status(statusCode).json({
      status: 'error',
      message,
      ...(details !== undefined && { details }),
    });
  };
}

export const errorHandlerMiddleware = new ErrorHandlerMiddleware();
export const errorHandler = errorHandlerMiddleware.handle;
