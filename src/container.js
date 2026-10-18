import { pool } from './config/database.config.js';
import CategoryRepository from './repositories/category.repositorie.js';
import CategoryService from './services/category.service.js';
import  CategoryController from './controllers/category.controller.js';

import AuthorRepository from './repositories/author.repository.js';
import AuthorService from './services/author.service.js';
import AuthorController from './controllers/author.controller.js';

import RoleRepository from './repositories/role.repository.js';
import RoleService from './services/role.service.js';
import RoleController from './controllers/role.controller.js';


const categoryRepository = new CategoryRepository(pool);
const categoryService = new CategoryService(categoryRepository);

const authorRepository = new AuthorRepository(pool);
const authorService = new AuthorService(authorRepository);


const roleRepository = new RoleRepository(pool);
const roleService = new RoleService(roleRepository);


export const categoryController = new CategoryController(categoryService);
export const authorController = new AuthorController(authorService);
export const roleController = new RoleController(roleService);
