export class AppError extends Error {
    constructor( message, statusCode = 500, details = undefined){
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.details = details;

    }

}

export class NotFoundError extends AppError{
    constructor(message = 'Recurso no encontrado'){
        super(message, 404);
    }
}


export class BadRequestError extends AppError {
    constructor(details) {
        if (typeof details === 'string') {
            super(details, 400);
        } else {
            super('Datos de entrada invalidos', 400, details);
        }
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = 'No autenticado') {
        super(message, 401);
    }
}

export class ForbiddenError extends AppError {
    constructor(message = 'No tienes permisos para realizar esta accion') {
        super(message, 403);
    }
}

export class ConflictError extends AppError {
    constructor(message = 'El recurso ya existe') {
        super(message, 409);
    }
}

export class TooManyRequestsError extends AppError {
    constructor(message = 'Demasiadas peticiones, intenta mas tarde') {
        super(message, 429);
    }
}