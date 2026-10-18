import { Router} from 'express';
import { validateRequest} from  '../middlewares/validateRequest.middleware.js';
import { categoryBodyRules, categoryIdRules } from '../validators/category.validator.js';

export default function createCategoryRouter ( categoryController){
    const router = Router();

    router.get('/',categoryController.getAll);
    router.get('/:id',categoryIdRules, validateRequest, categoryController.getById);
    router.post('/',categoryBodyRules, validateRequest, categoryController.create);
    router.put('/:id',categoryIdRules, categoryBodyRules, validateRequest, categoryController.update);
    router.delete('/:id',categoryIdRules, validateRequest, categoryController.delete);
    
    return router;
}   