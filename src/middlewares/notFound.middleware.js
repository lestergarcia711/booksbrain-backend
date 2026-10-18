import { NotFoundError} from '../errors/http.errors.js';

export const notFoundHandler = (req, res, next)=>{
    next(new NotFoundError(`Ruta no encontrada: ${req.method} ${req.originalUrl}`));

};
