import { env } from './env.config.js';

// Construye y encapsula la especificación OpenAPI 3.0 (Swagger) de la API del Sistema de Librería.
export default class SwaggerConfig {
  #spec;

  constructor(appEnv = env) {
    this.#spec = Object.freeze({
      openapi: '3.0.3',
      info: {
        title: 'Library System API',
        version: '1.0.0',
        description:
          'API REST sin estado (stateless) para la gestión integral de una librería física (préstamos, devoluciones, ventas presenciales, inventario y catálogo público), construida con Node.js, Express 5, MySQL y Programación Orientada a Objetos.',
      },
      servers: [
        {
          url: `http://localhost:${appEnv.port}/api/v1`,
          description: 'Servidor local de desarrollo',
        },
      ],
      tags: [
        { name: 'Health', description: 'Estado de salud del servidor' },
        { name: 'Auth', description: 'Autenticación stateless mediante JWT en cookie httpOnly' },
        { name: 'Catalog', description: 'Catálogo público de solo lectura con filtros y rate-limit' },
        { name: 'Me (Client)', description: 'Consultas exclusivas del cliente autenticado (SUS préstamos y SUS compras)' },
        { name: 'Users (Admin)', description: 'Gestión administrativa de usuarios y alta de clientes' },
        { name: 'Roles (Admin)', description: 'Consulta de roles del sistema' },
        { name: 'Categories (Admin)', description: 'Gestión administrativa de categorías literarias' },
        { name: 'Authors (Admin)', description: 'Gestión administrativa de autores' },
        { name: 'Books (Admin)', description: 'Gestión administrativa de libros e inventario base (UoW)' },
        { name: 'Book Copies (Admin)', description: 'Gestión administrativa de ejemplares físicos y códigos de barras (UoW)' },
        { name: 'Loans (Admin)', description: 'Motor de préstamos y devoluciones presenciales con bloqueo FOR UPDATE' },
        { name: 'Purchases (Admin)', description: 'Motor de ventas presenciales con cálculo exacto en centavos y bloqueo FOR UPDATE' },
      ],
      components: {
        securitySchemes: {
          cookieAuth: {
            type: 'apiKey',
            in: 'cookie',
            name: appEnv.jwt.cookieName,
            description: 'Token JWT (HS256) almacenado automáticamente en cookie httpOnly tras POST /auth/login',
          },
        },
        schemas: this.#buildSchemas(),
      },
      paths: this.#buildPaths(),
    });
  }

  get specification() {
    return this.#spec;
  }

  #buildSchemas() {
    return {
      ErrorResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'error' },
          message: { type: 'string', example: 'Descripción del error' },
          details: {
            oneOf: [
              {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    field: { type: 'string' },
                    message: { type: 'string' },
                  },
                },
              },
              { type: 'object' },
            ],
          },
        },
      },
      PaginationMeta: {
        type: 'object',
        properties: {
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 10 },
          total: { type: 'integer', example: 42 },
          totalPages: { type: 'integer', example: 5 },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'admin@library.local' },
          password: { type: 'string', example: 'AdminSecret123' },
        },
      },
      PasswordUpdateRequest: {
        type: 'object',
        required: ['currentPassword', 'newPassword'],
        properties: {
          currentPassword: { type: 'string', example: 'ClaveActual123' },
          newPassword: { type: 'string', example: 'NuevaClaveSegura456' },
        },
      },
      UserResponse: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          idCard: { type: 'string', example: '1098765432' },
          fullName: { type: 'string', example: 'Juan Pérez' },
          phone: { type: 'string', nullable: true, example: '3001234567' },
          address: { type: 'string', nullable: true, example: 'Calle 10 # 20-30' },
          email: { type: 'string', format: 'email', example: 'juan@correo.com' },
          role: {
            type: 'object',
            properties: {
              id: { type: 'integer', example: 2 },
              name: { type: 'string', example: 'Client' },
            },
          },
          temporaryPassword: {
            type: 'string',
            description: 'Presente únicamente una vez al crear un nuevo cliente (Cache-Control: no-store)',
            example: 'Xk9mP2qR7vL4A1a',
          },
        },
      },
      UserCreateRequest: {
        type: 'object',
        required: ['idCard', 'fullName', 'email'],
        properties: {
          idCard: { type: 'string', example: '1098765432' },
          fullName: { type: 'string', example: 'María Gómez' },
          email: { type: 'string', format: 'email', example: 'maria@correo.com' },
          phone: { type: 'string', example: '3109876543' },
          address: { type: 'string', example: 'Carrera 15 # 45-10' },
        },
      },
      CatalogBookResponse: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          title: { type: 'string', example: 'Cien años de soledad' },
          salePrice: { type: 'number', format: 'float', example: 45.5 },
          category: {
            type: 'object',
            properties: {
              id: { type: 'integer', example: 1 },
              name: { type: 'string', example: 'Novela' },
            },
          },
          authors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'integer', example: 1 },
                fullName: { type: 'string', example: 'Gabriel García Márquez' },
              },
            },
          },
          available: { type: 'boolean', example: true },
        },
      },
      BookCreateRequest: {
        type: 'object',
        required: ['title', 'isbn', 'salePrice', 'categoryId', 'authorIds'],
        properties: {
          title: { type: 'string', example: 'El amor en los tiempos del cólera' },
          isbn: { type: 'string', example: '978-0-307-38973-2' },
          salePrice: { type: 'number', example: 39.99 },
          categoryId: { type: 'integer', example: 1 },
          authorIds: { type: 'array', items: { type: 'integer' }, example: [1] },
        },
      },
      BookCopyCreateRequest: {
        type: 'object',
        required: ['bookId', 'barcode'],
        properties: {
          bookId: { type: 'integer', example: 1 },
          barcode: { type: 'string', example: 'BC-0001-A' },
          physicalCondition: { type: 'string', example: 'Good' },
          status: {
            type: 'string',
            enum: ['Available', 'Borrowed', 'Maintenance', 'Sold'],
            example: 'Available',
          },
        },
      },
      LoanCreateRequest: {
        type: 'object',
        description: 'Envía clientId XOR objeto client, y bookIds XOR copyIds.',
        properties: {
          clientId: { type: 'integer', example: 2 },
          client: { $ref: '#/components/schemas/UserCreateRequest' },
          bookIds: { type: 'array', items: { type: 'integer' }, example: [1, 2] },
          copyIds: { type: 'array', items: { type: 'integer' }, example: [10, 11] },
          expectedReturnDate: { type: 'string', format: 'date', example: '2026-12-01' },
        },
      },
      LoanReturnRequest: {
        type: 'object',
        required: ['returns'],
        properties: {
          returns: {
            type: 'array',
            items: {
              type: 'object',
              required: ['copyId', 'checkinCondition'],
              properties: {
                copyId: { type: 'integer', example: 10 },
                checkinCondition: {
                  type: 'string',
                  description: "Si es 'Poor', el ejemplar pasa a 'Maintenance' y el stock disponible no sube.",
                  example: 'Good',
                },
              },
            },
          },
        },
      },
      PurchaseCreateRequest: {
        type: 'object',
        required: ['items'],
        description: 'Envía clientId XOR objeto client. Libros repetidos en items suman sus cantidades.',
        properties: {
          clientId: { type: 'integer', example: 2 },
          client: { $ref: '#/components/schemas/UserCreateRequest' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              required: ['bookId', 'quantity'],
              properties: {
                bookId: { type: 'integer', example: 1 },
                quantity: { type: 'integer', example: 2 },
              },
            },
          },
        },
      },
    };
  }

  #buildPaths() {
    return {
      '/health': {
        get: {
          tags: ['Health'],
          summary: 'Verifica que la API se encuentra activa',
          responses: {
            200: { description: 'Servidor operativo' },
          },
        },
      },
      '/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Inicia sesión y emite JWT en cookie httpOnly',
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } },
            },
          },
          responses: {
            200: { description: 'Autenticación exitosa (establece cookie httpOnly)' },
            401: { description: 'Credenciales inválidas' },
            429: { description: 'Demasiados intentos en ventana de 15 minutos (IP + email)' },
          },
        },
      },
      '/auth/logout': {
        post: {
          tags: ['Auth'],
          security: [{ cookieAuth: [] }],
          summary: 'Cierra la sesión actual limpiando la cookie JWT',
          responses: {
            200: { description: 'Sesión cerrada correctamente' },
            401: { description: 'No autenticado' },
          },
        },
      },
      '/auth/me': {
        get: {
          tags: ['Auth'],
          security: [{ cookieAuth: [] }],
          summary: 'Obtiene el perfil del usuario autenticado a partir del token',
          responses: {
            200: { description: 'Perfil del usuario autenticado' },
            401: { description: 'No autenticado' },
          },
        },
      },
      '/auth/password': {
        patch: {
          tags: ['Auth'],
          security: [{ cookieAuth: [] }],
          summary: 'Actualiza la contraseña del usuario autenticado',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PasswordUpdateRequest' },
              },
            },
          },
          responses: {
            200: { description: 'Contraseña actualizada correctamente' },
            400: { description: 'Datos inválidos' },
            401: { description: 'Contraseña actual incorrecta o no autenticado' },
          },
        },
      },
      '/catalog': {
        get: {
          tags: ['Catalog'],
          summary: 'Lista paginada del catálogo público con filtros y ordenamiento',
          parameters: [
            { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Busca por título o nombre de autor' },
            { name: 'categoryId', in: 'query', schema: { type: 'integer' } },
            { name: 'authorId', in: 'query', schema: { type: 'integer' } },
            { name: 'availableOnly', in: 'query', schema: { type: 'boolean' } },
            { name: 'sortBy', in: 'query', schema: { type: 'string', enum: ['title', 'salePrice'] } },
            { name: 'order', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'] } },
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 10, maximum: 100 } },
          ],
          responses: {
            200: { description: 'Lista pública de libros sin datos sensibles' },
            429: { description: 'Límite de peticiones al catálogo excedido' },
          },
        },
      },
      '/catalog/{id}': {
        get: {
          tags: ['Catalog'],
          summary: 'Obtiene el detalle público de un libro por su ID',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: {
            200: { description: 'Detalle público del libro' },
            404: { description: 'Libro no encontrado' },
          },
        },
      },
      '/me/loans': {
        get: {
          tags: ['Me (Client)'],
          security: [{ cookieAuth: [] }],
          summary: 'Lista paginada de los préstamos propios del cliente autenticado',
          parameters: [
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['Active', 'Returned', 'Overdue'] } },
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          ],
          responses: {
            200: { description: 'Préstamos del cliente autenticado' },
            401: { description: 'No autenticado' },
            403: { description: 'Prohibido para rol Administrator' },
          },
        },
      },
      '/me/loans/{id}': {
        get: {
          tags: ['Me (Client)'],
          security: [{ cookieAuth: [] }],
          summary: 'Obtiene el detalle de un préstamo propio (404 si pertenece a otro cliente)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: {
            200: { description: 'Detalle del préstamo propio' },
            403: { description: 'Prohibido para rol Administrator' },
            404: { description: 'Préstamo no encontrado o pertenece a otro cliente' },
          },
        },
      },
      '/me/purchases': {
        get: {
          tags: ['Me (Client)'],
          security: [{ cookieAuth: [] }],
          summary: 'Lista paginada de las compras propias del cliente autenticado',
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          ],
          responses: {
            200: { description: 'Compras del cliente autenticado' },
            403: { description: 'Prohibido para rol Administrator' },
          },
        },
      },
      '/me/purchases/{id}': {
        get: {
          tags: ['Me (Client)'],
          security: [{ cookieAuth: [] }],
          summary: 'Obtiene el detalle de una compra propia (404 si pertenece a otro cliente)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: {
            200: { description: 'Detalle de la compra propia' },
            403: { description: 'Prohibido para rol Administrator' },
            404: { description: 'Compra no encontrada o pertenece a otro cliente' },
          },
        },
      },
      '/users': {
        get: {
          tags: ['Users (Admin)'],
          security: [{ cookieAuth: [] }],
          summary: 'Lista paginada de usuarios (Solo Admin)',
          responses: { 200: { description: 'Lista de usuarios' } },
        },
        post: {
          tags: ['Users (Admin)'],
          security: [{ cookieAuth: [] }],
          summary: 'Crea una cuenta de cliente con rol Client y contraseña aleatoria (Cache-Control: no-store)',
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/UserCreateRequest' } },
            },
          },
          responses: {
            201: { description: 'Cliente creado con contraseña temporal devuelta por única vez' },
            400: { description: 'Datos inválidos o intento de enviar roleId' },
            409: { description: 'Correo o identificación duplicada' },
          },
        },
      },
      '/users/{id}': {
        get: {
          tags: ['Users (Admin)'],
          security: [{ cookieAuth: [] }],
          summary: 'Obtiene un usuario por su ID (Solo Admin)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'Detalle del usuario' }, 404: { description: 'No encontrado' } },
        },
        patch: {
          tags: ['Users (Admin)'],
          security: [{ cookieAuth: [] }],
          summary: 'Actualiza datos básicos de un usuario (Solo Admin)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'Usuario actualizado' } },
        },
        delete: {
          tags: ['Users (Admin)'],
          security: [{ cookieAuth: [] }],
          summary: 'Elimina un usuario sin registros asociados (Solo Admin)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 204: { description: 'Eliminado' }, 409: { description: 'Tiene registros asociados' } },
        },
      },
      '/roles': {
        get: {
          tags: ['Roles (Admin)'],
          security: [{ cookieAuth: [] }],
          summary: 'Lista los roles del sistema (Solo Admin)',
          responses: { 200: { description: 'Lista de roles' } },
        },
      },
      '/categories': {
        get: {
          tags: ['Categories (Admin)'],
          security: [{ cookieAuth: [] }],
          summary: 'Lista todas las categorías (Solo Admin)',
          responses: { 200: { description: 'Lista de categorías' } },
        },
        post: {
          tags: ['Categories (Admin)'],
          security: [{ cookieAuth: [] }],
          summary: 'Crea una nueva categoría (Solo Admin)',
          responses: { 201: { description: 'Categoría creada' } },
        },
      },
      '/authors': {
        get: {
          tags: ['Authors (Admin)'],
          security: [{ cookieAuth: [] }],
          summary: 'Lista todos los autores (Solo Admin)',
          responses: { 200: { description: 'Lista de autores' } },
        },
        post: {
          tags: ['Authors (Admin)'],
          security: [{ cookieAuth: [] }],
          summary: 'Crea un nuevo autor (Solo Admin)',
          responses: { 201: { description: 'Autor creado' } },
        },
      },
      '/books': {
        get: {
          tags: ['Books (Admin)'],
          security: [{ cookieAuth: [] }],
          summary: 'Lista paginada de libros con inventario completo (Solo Admin)',
          responses: { 200: { description: 'Lista de libros con stock disponible y mínimo' } },
        },
        post: {
          tags: ['Books (Admin)'],
          security: [{ cookieAuth: [] }],
          summary: 'Crea un libro, vincula autores e inicializa inventario usando Unit of Work',
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/BookCreateRequest' } },
            },
          },
          responses: { 201: { description: 'Libro creado atómicamente' } },
        },
      },
      '/book-copies': {
        get: {
          tags: ['Book Copies (Admin)'],
          security: [{ cookieAuth: [] }],
          summary: 'Lista paginada de ejemplares físicos (Solo Admin)',
          responses: { 200: { description: 'Lista de ejemplares físicos' } },
        },
        post: {
          tags: ['Book Copies (Admin)'],
          security: [{ cookieAuth: [] }],
          summary: 'Registra un ejemplar físico y sincroniza available_stock en inventario (UoW)',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/BookCopyCreateRequest' },
              },
            },
          },
          responses: { 201: { description: 'Ejemplar registrado y stock actualizado' } },
        },
      },
      '/loans': {
        get: {
          tags: ['Loans (Admin)'],
          security: [{ cookieAuth: [] }],
          summary: 'Lista paginada de préstamos con estado Overdue derivado dinámicamente',
          parameters: [
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['Active', 'Returned', 'Overdue'] } },
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          ],
          responses: { 200: { description: 'Lista de préstamos' } },
        },
        post: {
          tags: ['Loans (Admin)'],
          security: [{ cookieAuth: [] }],
          summary: 'Registra un préstamo presencial (con cliente existente o nuevo inline en la misma transacción UoW)',
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/LoanCreateRequest' } },
            },
          },
          responses: {
            201: { description: 'Préstamo creado y stock descontado' },
            409: { description: 'Límite de copias activas superado, falta de copias o conflicto de concurrencia' },
          },
        },
      },
      '/loans/{id}/return': {
        post: {
          tags: ['Loans (Admin)'],
          security: [{ cookieAuth: [] }],
          summary: 'Registra la devolución de ejemplares actualizando condiciones físicas y stock (UoW)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/LoanReturnRequest' } },
            },
          },
          responses: {
            200: { description: 'Devolución procesada exitosamente' },
            409: { description: 'Ejemplar ya devuelto o préstamo ya cerrado' },
          },
        },
      },
      '/purchases': {
        get: {
          tags: ['Purchases (Admin)'],
          security: [{ cookieAuth: [] }],
          summary: 'Lista paginada de compras presenciales (Solo Admin)',
          responses: { 200: { description: 'Lista de compras' } },
        },
        post: {
          tags: ['Purchases (Admin)'],
          security: [{ cookieAuth: [] }],
          summary: 'Registra una venta presencial tomando copias Available (menor copy_id) con bloqueo FOR UPDATE',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PurchaseCreateRequest' },
              },
            },
          },
          responses: {
            201: { description: 'Venta registrada con total_amount calculado en el servidor' },
            409: { description: 'Stock insuficiente (informa libro y cantidad disponible sin cambios parciales)' },
          },
        },
      },
    };
  }
}

export const swaggerConfig = new SwaggerConfig();
