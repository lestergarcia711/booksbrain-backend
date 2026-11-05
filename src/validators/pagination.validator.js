import { query } from 'express-validator';

export const paginationRules = [
query('page').optional().isInt({min: 1}).withMessage('page debe ser >=1').toInt(),
query('limit').optional().isInt({min : 1, max: 100}).withMessage('limit debe ser entre 1 y 100').toInt(),

];

