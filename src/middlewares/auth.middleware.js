import { ForbiddenError, UnauthorizedError } from '../errors/http.errors.js';

// Encapsula los middlewares de autenticación (Passport sin sesiones) y autorización por roles.
export default class AuthMiddleware {
  #passport;

  constructor(passport) {
    this.#passport = passport;
  }

  // Autentica credenciales en POST /auth/login usando la estrategia 'local'.
  authenticateLocal = (req, res, next) => {
    this.#passport.authenticate('local', { session: false }, (err, user) => {
      if (err) return next(err);
      if (!user) return next(new UnauthorizedError('Credenciales invalidas'));
      req.user = user;
      return next();
    })(req, res, next);
  };

  // Verifica el JWT en la cookie httpOnly usando la estrategia 'jwt'.
  authenticate = (req, res, next) => {
    this.#passport.authenticate('jwt', { session: false }, (err, user) => {
      if (err) return next(err);
      if (!user) return next(new UnauthorizedError('No autenticado o sesion expirada'));
      req.user = user;
      return next();
    })(req, res, next);
  };

  // Restringe el acceso únicamente a los roles permitidos (definidos en constants/).
  authorize = (...allowedRoles) => (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('No autenticado'));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError('No tienes permisos para realizar esta accion'));
    }
    return next();
  };
}
