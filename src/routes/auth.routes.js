import { Router } from 'express';
import { validateRequest } from '../middlewares/validateRequest.middleware.js';
import { loginRules, passwordUpdateRules } from '../validators/auth.validator.js';

// Encapsula el enrutador de autenticación (/api/v1/auth) mediante programación orientada a objetos.
export default class AuthRouter {
  #router;
  #authController;
  #authMiddleware;
  #rateLimitMiddleware;

  constructor({ authController, authMiddleware, rateLimitMiddleware }) {
    this.#router = Router();
    this.#authController = authController;
    this.#authMiddleware = authMiddleware;
    this.#rateLimitMiddleware = rateLimitMiddleware;
    this.#initializeRoutes();
  }

  get router() {
    return this.#router;
  }

  #initializeRoutes() {
    this.#router.post(
      '/login',
      this.#rateLimitMiddleware.loginLimiter,
      loginRules,
      validateRequest,
      this.#authMiddleware.authenticateLocal,
      this.#authController.login
    );

    this.#router.post(
      '/logout',
      this.#authMiddleware.authenticate,
      this.#authController.logout
    );

    this.#router.get(
      '/me',
      this.#authMiddleware.authenticate,
      this.#authController.me
    );

    this.#router.patch(
      '/password',
      this.#authMiddleware.authenticate,
      passwordUpdateRules,
      validateRequest,
      this.#authController.updatePassword
    );
  }
}
