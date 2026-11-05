# Library System API

## 1. Problema que Resuelve
Digitaliza y controla la operación presencial de una **librería física** evitando inconsistencias de inventario, préstamos duplicados o sobreventa de ejemplares:
- **Control exacto por ejemplar físico (`book_copies`):** Cada copia tiene su propio código de barras, condición física y estado (`Available`, `Borrowed`, `Maintenance`, `Sold`) sincronizado transaccionalmente con el stock general (`inventory`).
- **Operación presencial segura:** Solo el **Administrador** registra préstamos, devoluciones y ventas en mostrador (pudiendo dar de alta al cliente en su primera transacción).
- **Portal de consulta para clientes y catálogo público:** Cualquier visitante puede consultar el catálogo disponible sin ver datos internos, y cada **Cliente** autenticado puede consultar únicamente el historial de **sus** préstamos y **sus** compras.

---

## 2. Tecnologías Utilizadas
- **Entorno y Lenguaje:** Node.js (ES Modules) con **Programación Orientada a Objetos (POO)** y arquitectura en capas (`Route → Validator → Controller → Service → Repository` + `DTOs` + `Unit of Work`).
- **Framework Web:** Express `^5.3.0`.
- **Base de Datos:** MySQL (`mysql2/promise` `^3.24.6`) con transacciones explícitas y bloqueo pesimista (`SELECT ... FOR UPDATE`).
- **Seguridad y Autenticación:** Passport (`passport-local`, `passport-jwt`), `jsonwebtoken` (HS256 en cookie `httpOnly`), `bcrypt`, `helmet`, `cors`, `cookie-parser`, `express-rate-limit` y `express-validator`.
- **Documentación y Pruebas:** Swagger (`swagger-ui-express` OpenAPI 3.0) y Node.js Test Runner (`node:test`).

---

## 3. Instalación
1. **Clonar el repositorio e instalar dependencias:**
   ```bash
   npm install
   ```
2. **Crear la base de datos en MySQL:**
   ```bash
   mysql -u root -p < database/script.sql
   ```
3. **Configurar las variables de entorno:**
   Copia `.env.example` a `.env` y define tus credenciales de MySQL y un `JWT_SECRET` de mínimo 32 caracteres:
   ```bash
   cp .env.example .env
   ```
4. **Crear el primer usuario Administrador:**
   ```bash
   npm run seed:admin
   ```
   *(Genera el administrador inicial e imprime en consola su contraseña temporal por única vez).*

---

## 4. Ejecución
- **Modo desarrollo (recarga automática con Nodemon):**
  ```bash
  npm run dev
  ```
- **Modo producción:**
  ```bash
  npm start
  ```
- **Ejecutar pruebas de integración:**
  ```bash
  npm test
  ```

---

## 5. Entrypoints (URL Base: `http://localhost:3000/api/v1`)

- **Entrypoint principal de la aplicación:** `src/server.js`
- **Swagger UI (Documentación interactiva):** `http://localhost:3000/api/v1/docs`
- **Especificación OpenAPI JSON:** `http://localhost:3000/api/v1/docs/json`

### Documentación y Salud
| Método | Endpoint | Acceso | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/docs` | Público | Interfaz interactiva **Swagger UI** |
| `GET` | `/api/v1/docs/json` | Público | Especificación OpenAPI 3.0 en formato JSON |
| `GET` | `/api/v1/health` | Público | Verificación de estado del servidor |

### Autenticación (`/api/v1/auth`)
| Método | Endpoint | Acceso | Descripción |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | Público | Inicia sesión (`{ email, password }`) y emite cookie `httpOnly` |
| `POST` | `/api/v1/auth/logout` | Autenticado | Cierra sesión limpiando la cookie |
| `GET` | `/api/v1/auth/me` | Autenticado | Devuelve el perfil del usuario autenticado |
| `PATCH` | `/api/v1/auth/password` | Autenticado | Cambia la contraseña (`{ currentPassword, newPassword }`) |

### Catálogo Público (`/api/v1/catalog`)
| Método | Endpoint | Acceso | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/catalog` | Público | Lista libros con filtros (`search`, `categoryId`, `authorId`, `availableOnly`, `sortBy`, `order`, `page`, `limit`) |
| `GET` | `/api/v1/catalog/:id` | Público | Detalle público de un libro |

### Portal del Cliente (`/api/v1/me`)
| Método | Endpoint | Acceso | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/me/loans` | Solo `Client` | Lista paginada de los préstamos del cliente autenticado |
| `GET` | `/api/v1/me/loans/:id` | Solo `Client` | Detalle de un préstamo propio (`404` si pertenece a otro cliente) |
| `GET` | `/api/v1/me/purchases` | Solo `Client` | Lista paginada de las compras del cliente autenticado |
| `GET` | `/api/v1/me/purchases/:id` | Solo `Client` | Detalle de una compra propia (`404` si pertenece a otro cliente) |

### Gestión Administrativa (Solo `Administrator`)
| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET, POST` | `/api/v1/categories` | Lista y crea categorías literarias (`PUT / DELETE` en `/:id`) |
| `GET, POST` | `/api/v1/authors` | Lista y crea autores (`PUT / DELETE` en `/:id`) |
| `GET` | `/api/v1/roles` | Lista los roles del sistema (`Administrator`, `Client`) |
| `GET, POST` | `/api/v1/users` | Lista usuarios y registra clientes nuevos con clave aleatoria (`PATCH / DELETE` en `/:id`) |
| `GET, POST` | `/api/v1/books` | Lista y crea libros inicializando su inventario (`PATCH / DELETE` en `/:id`) |
| `GET, POST` | `/api/v1/book-copies` | Lista y registra ejemplares físicos actualizando stock (`PATCH / DELETE` en `/:id`) |
| `GET, POST` | `/api/v1/loans` | Lista préstamos y registra salidas (acepta `clientId` XOR `client` nuevo inline) |
| `POST, PATCH` | `/api/v1/loans/:id/return` | Registra devolución de ejemplares (`returns: [{ copyId, checkinCondition }]`) |
| `GET, POST` | `/api/v1/purchases` | Lista y registra ventas presenciales (`items: [{ bookId, quantity }]`) |
