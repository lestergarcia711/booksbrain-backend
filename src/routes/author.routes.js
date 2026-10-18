import { Router} from 'express';
import { validateRequest} from  '../middlewares/validateRequest.middleware.js';
import {  authorBodyRules, authorIdRules } from '../validators/author.validator.js';

export default function createAuthorRouter ( authorController ){
    const router = Router();

    router.get('/', authorController.getAll);
    router.get('/:id', authorIdRules, validateRequest, authorController.getById);
    router.post('/', authorBodyRules, validateRequest, authorController.create);
    router.put('/:id', authorIdRules,  authorBodyRules, validateRequest, authorController.update);
    router.delete('/:id', authorIdRules, validateRequest, authorController.delete);
    
    return router;
}   