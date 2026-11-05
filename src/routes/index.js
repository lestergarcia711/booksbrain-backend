import { Router } from "express";
import createCategoryRouter from "./category.routes.js";
import createAuthorRouter from "./author.routes.js";
import createRoleRouter from "./role.routes.js";
import createUserRouter from './user.routes.js';
import createBookRouter from './book.routes.js';


export default function createApiRouter({ categoryController,
    authorController, roleController, userController,bookController}) {
    const router = Router();
    router.use('/categories', createCategoryRouter(categoryController));
    router.use('/authors', createAuthorRouter(authorController));
    router.use('/roles', createRoleRouter(roleController));
    router.use('/users', createUserRouter(userController));
    router.use('/books', createBookRouter(bookController));

    
    
    return router;
}