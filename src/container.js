import { pool } from './config/database.config.js';
import CategoryRepository from './repositories/category.repositorie.js';
import CategoryService from './services/category.service.js';
import  CategoryController from './controllers/category.controller.js';


const categoryRepository = new CategoryRepository(pool);
const categoryService = new CategoryService(categoryRepository);

export const categoryController = new CategoryController(categoryService);