import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.config.js';
import { container } from './container.js';
import ApiRouter from './routes/index.js';
import { notFoundHandler } from './middlewares/notFound.middleware.js';
import { errorHandler } from './middlewares/errorHandler.middleware.js';

// Encapsula la configuración de la aplicación Express 5 con sus capas de seguridad y enrutamiento.
export class Application {
  #app;
  #container;
  #env;

  constructor(dependencyContainer = container, appEnv = env) {
    this.#app = express();
    this.#container = dependencyContainer;
    this.#env = appEnv;
    this.#configureMiddlewares();
    this.#configureRoutes();
    this.#configureErrorHandling();
  }

  get instance() {
    return this.#app;
  }

  #configureMiddlewares() {
    const { csrfMiddleware, rateLimitMiddleware } = this.#container.middlewares;

    this.#app.use(helmet());
    this.#app.use(
      cors({
        origin: this.#env.security.corsOrigins,
        credentials: true,
      })
    );
    this.#app.use(cookieParser());
    this.#app.use(express.json({ limit: '10kb' }));
    this.#app.use(this.#container.passportConfig.initialize());
    this.#app.use(rateLimitMiddleware.globalLimiter);
    this.#app.use(csrfMiddleware.verifyOrigin);
  }

  #configureRoutes() {
    this.#app.get('/api/v1/health', (req, res) => {
      res.status(200).json({ status: 'success', message: 'API funcionando' });
    });

    const apiRouter = new ApiRouter({
      ...this.#container.controllers,
      ...this.#container.middlewares,
    });

    this.#app.use('/api/v1', apiRouter.router);
  }

  #configureErrorHandling() {
    this.#app.use(notFoundHandler);
    this.#app.use(errorHandler);
  }
}

const application = new Application();
export default application.instance;
