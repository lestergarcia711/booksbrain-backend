import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerConfig } from '../config/swagger.config.js';

// Encapsula el enrutador de documentación interactiva OpenAPI / Swagger UI (/api/v1/docs).
export default class DocsRouter {
  #router;
  #specification;

  constructor(specification = swaggerConfig.specification) {
    this.#router = Router();
    this.#specification = specification;
    this.#initializeRoutes();
  }

  get router() {
    return this.#router;
  }

  #initializeRoutes() {
    this.#router.get('/json', (req, res) => {
      res.status(200).json(this.#specification);
    });

    this.#router.use(
      '/',
      swaggerUi.serve,
      swaggerUi.setup(this.#specification, {
        customSiteTitle: 'Library System API - Swagger Docs',
      })
    );
  }
}
