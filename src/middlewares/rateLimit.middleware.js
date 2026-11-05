import { rateLimit, ipKeyGenerator } from 'express-rate-limit';
import { TooManyRequestsError } from '../errors/http.errors.js';

// Configura y expone los limitadores de tasa de peticiones (global, login por IP+email y catálogo).
export default class RateLimitMiddleware {
  #globalLimiter;
  #loginLimiter;
  #catalogLimiter;

  constructor(rateLimitConfig) {
    this.#globalLimiter = rateLimit({
      windowMs: rateLimitConfig.globalWindowMs,
      limit: rateLimitConfig.globalMax,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      handler: (req, res, next) => {
        next(new TooManyRequestsError('Has excedido el limite global de peticiones'));
      },
    });

    // Limita intentos de login combinando IP + email en una ventana de 15 minutos.
    this.#loginLimiter = rateLimit({
      windowMs: rateLimitConfig.loginWindowMs,
      limit: rateLimitConfig.loginMax,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      keyGenerator: (req) => {
        const ip = ipKeyGenerator(req.ip ?? '127.0.0.1');
        const email = String(req.body?.email ?? '').trim().toLowerCase();
        return `${ip}:${email}`;
      },
      handler: (req, res, next) => {
        next(
          new TooManyRequestsError(
            'Demasiados intentos de inicio de sesion. Intenta de nuevo en 15 minutos'
          )
        );
      },
    });

    this.#catalogLimiter = rateLimit({
      windowMs: rateLimitConfig.catalogWindowMs,
      limit: rateLimitConfig.catalogMax,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      handler: (req, res, next) => {
        next(new TooManyRequestsError('Has excedido el limite de consultas al catalogo'));
      },
    });
  }

  get globalLimiter() {
    return this.#globalLimiter;
  }

  get loginLimiter() {
    return this.#loginLimiter;
  }

  get catalogLimiter() {
    return this.#catalogLimiter;
  }
}
