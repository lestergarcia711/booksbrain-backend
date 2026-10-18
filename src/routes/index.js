import { Router } from "express";
import createCategoryRouter from "./category.routes.js";
import createAuthorRouter from "./author.routes.js";


export default function createApiRouter({ categoryController, authorController}) {
    const router = Router();
    router.use('/categories', createCategoryRouter(categoryController));
    router.use('/authors', createAuthorRouter(authorController));
    
    return router;
}