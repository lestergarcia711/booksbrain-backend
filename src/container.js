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

import UserRepository from './repositories/user.repository.js';
import UserService from './services/user.service.js';
import UserController from './controllers/user.controller.js';
import PasswordHasher from './utils/password.hasher.js';
import { env } from './config/env.config.js';

import BookRepository from './repositories/book.repository.js';
import BookService from './services/book.service.js';
import BookController from './controllers/book.controller.js';


const categoryRepository = new CategoryRepository(pool);
const categoryService = new CategoryService(categoryRepository);

const authorRepository = new AuthorRepository(pool);
const authorService = new AuthorService(authorRepository);


const roleRepository = new RoleRepository(pool);
const roleService = new RoleService(roleRepository);

const userRepository = new UserRepository(pool);
const passwordHasher = new PasswordHasher(env.security.saltRounds);
const userService = new UserService(userRepository, roleRepository, passwordHasher);


const bookRepository = new BookRepository(pool);
const bookService = new BookService(bookRepository, categoryRepository, authorRepository);




export const categoryController = new CategoryController(categoryService);
export const authorController = new AuthorController(authorService);
export const roleController = new RoleController(roleService);
export const userController = new UserController(userService);
export const bookController = new BookController(bookService);