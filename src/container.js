import passport from 'passport';
import { pool } from './config/database.config.js';
import { env } from './config/env.config.js';
import PassportConfig from './config/passport.config.js';

import PasswordHasher from './utils/password.hasher.js';
import TokenService from './utils/token.service.js';
import UnitOfWork from './utils/unitOfWork.js';

import AuthMiddleware from './middlewares/auth.middleware.js';
import CsrfMiddleware from './middlewares/csrf.middleware.js';
import RateLimitMiddleware from './middlewares/rateLimit.middleware.js';

import CategoryRepository from './repositories/category.repository.js';
import AuthorRepository from './repositories/author.repository.js';
import RoleRepository from './repositories/role.repository.js';
import UserRepository from './repositories/user.repository.js';
import BookRepository from './repositories/book.repository.js';
import InventoryRepository from './repositories/inventory.repository.js';
import BookCopyRepository from './repositories/bookCopy.repository.js';
import LoanRepository from './repositories/loan.repository.js';
import PurchaseRepository from './repositories/purchase.repository.js';

import CategoryService from './services/category.service.js';
import AuthorService from './services/author.service.js';
import RoleService from './services/role.service.js';
import UserService from './services/user.service.js';
import BookService from './services/book.service.js';
import BookCopyService from './services/bookCopy.service.js';
import CatalogService from './services/catalog.service.js';
import AuthService from './services/auth.service.js';
import LoanService from './services/loan.service.js';
import PurchaseService from './services/purchase.service.js';

import CategoryController from './controllers/category.controller.js';
import AuthorController from './controllers/author.controller.js';
import RoleController from './controllers/role.controller.js';
import UserController from './controllers/user.controller.js';
import BookController from './controllers/book.controller.js';
import BookCopyController from './controllers/bookCopy.controller.js';
import CatalogController from './controllers/catalog.controller.js';
import AuthController from './controllers/auth.controller.js';
import LoanController from './controllers/loan.controller.js';
import PurchaseController from './controllers/purchase.controller.js';
import MeController from './controllers/me.controller.js';

// Contenedor de inversión de control (IoC) que instancia e inyecta todas las capas de la aplicación.
export default class DependencyContainer {
  #unitOfWork;
  #passwordHasher;
  #tokenService;
  #repositories;
  #services;
  #middlewares;
  #controllers;
  #passportConfig;

  constructor(dbPool = pool, appEnv = env) {
    this.#unitOfWork = new UnitOfWork(dbPool);
    this.#passwordHasher = new PasswordHasher(appEnv.security.saltRounds);
    this.#tokenService = new TokenService({
      secret: appEnv.jwt.secret,
      expiresIn: appEnv.jwt.expiresIn,
      cookieName: appEnv.jwt.cookieName,
      isProduction: appEnv.nodeEnv === 'production',
    });

    this.#repositories = Object.freeze({
      categoryRepository: new CategoryRepository(dbPool),
      authorRepository: new AuthorRepository(dbPool),
      roleRepository: new RoleRepository(dbPool),
      userRepository: new UserRepository(dbPool),
      bookRepository: new BookRepository(dbPool),
      inventoryRepository: new InventoryRepository(dbPool),
      bookCopyRepository: new BookCopyRepository(dbPool),
      loanRepository: new LoanRepository(dbPool),
      purchaseRepository: new PurchaseRepository(dbPool),
    });

    const userService = new UserService(
      this.#repositories.userRepository,
      this.#repositories.roleRepository,
      this.#passwordHasher
    );

    const authService = new AuthService(
      this.#repositories.userRepository,
      this.#passwordHasher,
      this.#tokenService
    );

    const loanService = new LoanService(
      this.#repositories.loanRepository,
      this.#repositories.bookCopyRepository,
      this.#repositories.bookRepository,
      this.#repositories.inventoryRepository,
      userService,
      this.#unitOfWork,
      appEnv.loans
    );

    const purchaseService = new PurchaseService(
      this.#repositories.purchaseRepository,
      this.#repositories.bookCopyRepository,
      this.#repositories.bookRepository,
      this.#repositories.inventoryRepository,
      userService,
      this.#unitOfWork
    );

    this.#services = Object.freeze({
      categoryService: new CategoryService(this.#repositories.categoryRepository),
      authorService: new AuthorService(this.#repositories.authorRepository),
      roleService: new RoleService(this.#repositories.roleRepository),
      userService,
      bookService: new BookService(
        this.#repositories.bookRepository,
        this.#repositories.categoryRepository,
        this.#repositories.authorRepository,
        this.#repositories.inventoryRepository,
        this.#unitOfWork
      ),
      bookCopyService: new BookCopyService(
        this.#repositories.bookCopyRepository,
        this.#repositories.bookRepository,
        this.#repositories.inventoryRepository,
        this.#unitOfWork
      ),
      catalogService: new CatalogService(this.#repositories.bookRepository),
      authService,
      loanService,
      purchaseService,
    });

    this.#passportConfig = new PassportConfig(passport, authService, this.#tokenService);

    this.#middlewares = Object.freeze({
      authMiddleware: new AuthMiddleware(passport),
      csrfMiddleware: new CsrfMiddleware(appEnv.security.corsOrigins),
      rateLimitMiddleware: new RateLimitMiddleware(appEnv.rateLimit),
    });

    this.#controllers = Object.freeze({
      authController: new AuthController(authService),
      catalogController: new CatalogController(this.#services.catalogService),
      categoryController: new CategoryController(this.#services.categoryService),
      authorController: new AuthorController(this.#services.authorService),
      roleController: new RoleController(this.#services.roleService),
      userController: new UserController(userService),
      bookController: new BookController(this.#services.bookService),
      bookCopyController: new BookCopyController(this.#services.bookCopyService),
      loanController: new LoanController(loanService),
      purchaseController: new PurchaseController(purchaseService),
      meController: new MeController(loanService, purchaseService),
    });
  }

  get unitOfWork() {
    return this.#unitOfWork;
  }

  get passwordHasher() {
    return this.#passwordHasher;
  }

  get tokenService() {
    return this.#tokenService;
  }

  get repositories() {
    return this.#repositories;
  }

  get services() {
    return this.#services;
  }

  get middlewares() {
    return this.#middlewares;
  }

  get controllers() {
    return this.#controllers;
  }

  get passportConfig() {
    return this.#passportConfig;
  }
}

export const container = new DependencyContainer();
export const {
  authController,
  catalogController,
  categoryController,
  authorController,
  roleController,
  userController,
  bookController,
  bookCopyController,
  loanController,
  purchaseController,
  meController,
} = container.controllers;
export const { authMiddleware, csrfMiddleware, rateLimitMiddleware } = container.middlewares;
export const passportConfig = container.passportConfig;
