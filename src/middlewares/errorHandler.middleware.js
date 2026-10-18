import { AppError} from '../errors/http.errors.js';

import { env } from '../config/env.config.js';


const MYSQL_ERRORS ={
    ER_DUP_ENTRY: { status: 409, message: 'Ya existe un registro con esos datos unicos'},
    ER_NO_REFERENCED_ROW_2: { status: 400, message: 'Referencia invalida: No existe ningun registro con esa referencia'},
    ER_ROW_IS_REFERENCED_2: { status: 409, message: 'No se puede eliminar : tiene registro asociados.'},

    
};

export const errorHandler = ( err, req, res, next)=>{
    let statusCode = 500;
    let message = 'Error interno del servidor';
    let details;

    if (err instanceof AppError){
        ({ statusCode, message, details} = err);
    
    }else if(MYSQL_ERRORS[err.code]){
        ({ status: statusCode, message } = MYSQL_ERRORS[err.code])
      }else if (err.type === 'entity.parse.failed'){
        statusCode = 400;
        message = 'Formato JSON mal formado';
      }

      if ( statusCode === 500 && env.nodeEnv !== 'production') console.error(err);
      res.status(statusCode).json({
        status: 'error',
        message, ...(details && {details}),
      });
};
