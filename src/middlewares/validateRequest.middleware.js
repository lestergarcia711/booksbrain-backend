import {validationResult} from 'express-validator';
import { BadRequestError} from '../errors/http.errors.js';

export const validateRequest = (req, res , next) => {
    const result = validationResult(req);
    if(result.isEmpty()) return next();

    throw new BadRequestError(
        result.array().map((e)=> ({ field : e.path, message: e.msg}))

    );
};