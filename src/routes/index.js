import { Router } from 'express';
import { ROLES } from '../constants/roles.constants.js';
import DocsRouter from './docs.routes.js';
import AuthRouter from './auth.routes.js';
import CatalogRouter from './catalog.routes.js';
import CategoryRouter from './category.routes.js';
import AuthorRouter from './author.routes.js';
import RoleRouter from './role.routes.js';
import UserRouter from './user.routes.js';
import BookRouter from './book.routes.js';
import BookCopyRouter from './bookCopy.routes.js';
import LoanRouter from './loan.routes.js';
import PurchaseRouter from './purchase.routes.js';
import MeRouter from './me.routes.js';

// Ensambla y protege todos los sub-enrutadores bajo /api/v1 aplicando programación orientada a objetos.
export default class ApiRouter {
  #router;
  #dependencies;

  constructor(dependencies) {
    this.#router = Router();
    this.#dependencies = dependencies;
    this.#initializeRoutes();
  }

  get router() {
    return this.#router;
  }

  #initializeRoutes() {
    const {
      authController,
      authMiddleware,
      rateLimitMiddleware,
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
    } = this.#dependencies;

    // Documentación interactiva Swagger UI (/api/v1/docs) y especificación JSON (/api/v1/docs/json).
    this.#router.use('/docs', new DocsRouter().router);

    // Rutas públicas y de autenticación.
    this.#router.use(
      '/auth',
      new AuthRouter({ authController, authMiddleware, rateLimitMiddleware }).router
    );

    this.#router.use(
      '/catalog',
      new CatalogRouter({ catalogController, rateLimitMiddleware }).router
    );

    // Rutas exclusivas del cliente autenticado (bloquea a Administrator con 403).
    const clientOnly = [
      authMiddleware.authenticate,
      authMiddleware.authorize(ROLES.CLIENT),
    ];
    this.#router.use('/me', ...clientOnly, new MeRouter(meController).router);

    // Rutas exclusivas de administración (solo rol Administrator).
    const adminOnly = [
      authMiddleware.authenticate,
      authMiddleware.authorize(ROLES.ADMIN),
    ];

    this.#router.use(
      '/categories',
      ...adminOnly,
      new CategoryRouter(categoryController).router
    );
    this.#router.use(
      '/authors',
      ...adminOnly,
      new AuthorRouter(authorController).router
    );
    this.#router.use(
      '/roles',
      ...adminOnly,
      new RoleRouter(roleController).router
    );
    this.#router.use(
      '/users',
      ...adminOnly,
      new UserRouter(userController).router
    );
    this.#router.use(
      '/books',
      ...adminOnly,
      new BookRouter(bookController).router
    );
    this.#router.use(
      '/book-copies',
      ...adminOnly,
      new BookCopyRouter(bookCopyController).router
    );
    this.#router.use(
      '/loans',
      ...adminOnly,
      new LoanRouter(loanController).router
    );
    this.#router.use(
      '/purchases',
      ...adminOnly,
      new PurchaseRouter(purchaseController).router
    );
  }
}
