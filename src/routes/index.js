import { Router } from "express";
import createCategoryRouter from "./category.routes.js";

export default function createApiRouter({ categoryController }) {
    const router = Router();
    router.use('/categories', createCategoryRouter(categoryController));
    return router;
}