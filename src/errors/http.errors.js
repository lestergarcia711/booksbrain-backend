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


export class BadRequestError extends AppError{
    constructor(details){
        super('Datos de entrada invalidos', 400, details);
    }
}

export class ConflictError extends AppError{
    constructor(message = 'El recurso ya existe'){
        super(message, 409);
    }
}