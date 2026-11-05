import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import { pool } from '../src/config/database.config.js';
import { env } from '../src/config/env.config.js';
import { container } from '../src/container.js';
import { ROLES } from '../src/constants/roles.constants.js';

// Clase auxiliar orientada a objetos para ejecutar peticiones HTTP de prueba con manejo de cookies y cabeceras CSRF.
class HttpTestClient {
  #baseUrl;
  #defaultOrigin;
  #cookie;

  constructor(baseUrl, defaultOrigin) {
    this.#baseUrl = baseUrl;
    this.#defaultOrigin = defaultOrigin;
    this.#cookie = '';
  }

  get cookie() {
    return this.#cookie;
  }

  set cookie(value) {
    this.#cookie = value;
  }

  async request(method, path, { body, headers = {}, includeOrigin = true } = {}) {
    const reqHeaders = {
      ...(body !== undefined && { 'Content-Type': 'application/json' }),
      ...(includeOrigin && { Origin: this.#defaultOrigin }),
      ...(this.#cookie && { Cookie: this.#cookie }),
      ...headers,
    };

    const response = await fetch(`${this.#baseUrl}${path}`, {
      method,
      headers: reqHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      this.#cookie = setCookieHeader.split(';')[0];
    }

    let json = null;
    const text = await response.text();
    if (text) {
      try {
        json = JSON.parse(text);
      } catch {
        json = text;
      }
    }

    return {
      status: response.status,
      headers: response.headers,
      body: json,
      rawCookie: setCookieHeader,
    };
  }
}

describe('Suite Integral de Pruebas (Fases 1 a 6) - Library System API', () => {
  let server;
  let baseUrl;
  const allowedOrigin = env.security.corsOrigins[0];

  const createdIds = {
    loans: [],
    purchases: [],
    copies: [],
    books: [],
    authors: [],
    categories: [],
    users: [],
  };

  let adminClient;
  let clientOneHttp;
  let clientTwoHttp;
  let anonymousHttp;

  let adminUserId;
  let clientOneId;
  let clientOnePassword;
  let clientTwoId;

  let categoryId;
  let authorId;
  let bookOneId;
  let bookTwoId;

  before(async () => {
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const { port } = server.address();
        baseUrl = `http://127.0.0.1:${port}/api/v1`;
        resolve();
      });
    });

    adminClient = new HttpTestClient(baseUrl, allowedOrigin);
    clientOneHttp = new HttpTestClient(baseUrl, allowedOrigin);
    clientTwoHttp = new HttpTestClient(baseUrl, allowedOrigin);
    anonymousHttp = new HttpTestClient(baseUrl, allowedOrigin);

    // Crear un administrador temporal para las pruebas usando los repositorios del contenedor.
    const adminRole = await container.repositories.roleRepository.findByName(ROLES.ADMIN);
    const adminPass = 'AdminTest123';
    const hashedPass = await container.passwordHasher.hash(adminPass);
    const uniqueSuffix = Date.now().toString().slice(-6);

    adminUserId = await container.repositories.userRepository.create({
      idCard: `99900${uniqueSuffix}`,
      fullName: 'Admin Integration Test',
      phone: '3000000000',
      address: 'Calle Admin 1',
      email: `admintest_${uniqueSuffix}@library.local`,
      password: hashedPass,
      roleId: adminRole.role_id,
    });
    createdIds.users.push(adminUserId);

    const loginRes = await adminClient.request('POST', '/auth/login', {
      body: {
        email: `admintest_${uniqueSuffix}@library.local`,
        password: adminPass,
      },
    });
    assert.equal(loginRes.status, 200);
  });

  after(async () => {
    // Limpieza ordenada respetando llaves foráneas.
    if (createdIds.loans.length > 0) {
      await pool.query('DELETE FROM loans WHERE loan_id IN (?)', [createdIds.loans]);
    }
    if (createdIds.purchases.length > 0) {
      await pool.query('DELETE FROM purchases WHERE purchase_id IN (?)', [createdIds.purchases]);
    }
    if (createdIds.copies.length > 0) {
      await pool.query('DELETE FROM book_copies WHERE copy_id IN (?)', [createdIds.copies]);
    }
    if (createdIds.books.length > 0) {
      await pool.query('DELETE FROM books WHERE book_id IN (?)', [createdIds.books]);
    }
    if (createdIds.authors.length > 0) {
      await pool.query('DELETE FROM authors WHERE author_id IN (?)', [createdIds.authors]);
    }
    if (createdIds.categories.length > 0) {
      await pool.query('DELETE FROM categories WHERE category_id IN (?)', [createdIds.categories]);
    }
    if (createdIds.users.length > 0) {
      await pool.query('DELETE FROM users WHERE user_id IN (?)', [createdIds.users]);
    }

    await new Promise((resolve) => server.close(resolve));
    await pool.end();
  });

  describe('Fase 1: Seguridad Base, CSRF, Autenticación y POST /users', () => {
    it('expone la documentación Swagger OpenAPI 3.0 en GET /docs/json y GET /docs/', async () => {
      const jsonRes = await anonymousHttp.request('GET', '/docs/json');
      assert.equal(jsonRes.status, 200);
      assert.equal(jsonRes.body.openapi, '3.0.3');
      assert.ok(jsonRes.body.paths['/loans']);

      const htmlRes = await anonymousHttp.request('GET', '/docs/');
      assert.equal(htmlRes.status, 200);
    });

    it('bloquea con 403 peticiones POST sin cabecera Origin válida (protección CSRF)', async () => {
      const res = await anonymousHttp.request('POST', '/auth/login', {
        body: { email: 'nobody@library.local', password: 'Password123' },
        includeOrigin: false,
      });
      assert.equal(res.status, 403);
    });

    it('devuelve 401 con mensaje genérico si el email no existe en login', async () => {
      const res = await anonymousHttp.request('POST', '/auth/login', {
        body: { email: 'nonexistent_9999@library.local', password: 'Password123' },
      });
      assert.equal(res.status, 401);
      assert.equal(res.body.message, 'Credenciales invalidas');
    });

    it('permite consultar GET /auth/me con la cookie httpOnly del Admin', async () => {
      const res = await adminClient.request('GET', '/auth/me');
      assert.equal(res.status, 200);
      assert.equal(res.body.data.id, adminUserId);
      assert.equal(res.body.data.role.name, ROLES.ADMIN);
      assert.equal(res.body.data.password, undefined);
    });

    it('rechaza POST /users si se intenta enviar roleId en el body (deuda técnica corregida)', async () => {
      const suffix = Date.now().toString().slice(-6);
      const res = await adminClient.request('POST', '/users', {
        body: {
          idCard: `8881${suffix}`,
          fullName: 'Intento Escalada',
          email: `escalada_${suffix}@library.local`,
          roleId: 1,
        },
      });
      assert.equal(res.status, 400);
    });

    it('crea un cliente en POST /users con rol Client, clave temporal y Cache-Control: no-store', async () => {
      const suffix = Date.now().toString().slice(-6);
      const res = await adminClient.request('POST', '/users', {
        body: {
          idCard: `7771${suffix}`,
          fullName: 'Cliente Uno Prueba',
          email: `cliente1_${suffix}@library.local`,
          phone: '3110000001',
          address: 'Av Siempre Viva 123',
        },
      });

      assert.equal(res.status, 201);
      assert.equal(res.headers.get('cache-control'), 'no-store');
      assert.equal(res.body.data.role.name, ROLES.CLIENT);
      assert.ok(res.body.data.temporaryPassword);
      assert.ok(res.body.data.temporaryPassword.length >= 12);

      clientOneId = res.body.data.id;
      clientOnePassword = res.body.data.temporaryPassword;
      createdIds.users.push(clientOneId);

      // El cliente recién creado puede iniciar sesión y cambiar su contraseña.
      const loginClient = await clientOneHttp.request('POST', '/auth/login', {
        body: {
          email: `cliente1_${suffix}@library.local`,
          password: clientOnePassword,
        },
      });
      assert.equal(loginClient.status, 200);
      assert.ok(loginClient.rawCookie.includes('HttpOnly'));
      assert.ok(loginClient.rawCookie.includes('SameSite=Lax'));

      const newPass = 'NuevaClaveSegura99';
      const patchPass = await clientOneHttp.request('PATCH', '/auth/password', {
        body: {
          currentPassword: clientOnePassword,
          newPassword: newPass,
        },
      });
      assert.equal(patchPass.status, 200);
      clientOnePassword = newPass;
    });

    it('bloquea con 403 a un usuario con rol Client que intenta acceder a rutas de Admin', async () => {
      const res = await clientOneHttp.request('GET', '/users');
      assert.equal(res.status, 403);
    });
  });

  describe('Fase 2: Unit of Work en Libros (books) y Ejemplares (book-copies)', () => {
    it('crea categoría, autor, libros y ejemplares actualizando available_stock atómicamente', async () => {
      const suffix = Date.now().toString().slice(-5);

      const catRes = await adminClient.request('POST', '/categories', {
        body: { name: `Ficcion UoW ${suffix}` },
      });
      assert.equal(catRes.status, 201);
      categoryId = catRes.body.data.id;
      createdIds.categories.push(categoryId);

      const authRes = await adminClient.request('POST', '/authors', {
        body: { fullName: `Gabriel Test ${suffix}` },
      });
      assert.equal(authRes.status, 201);
      authorId = authRes.body.data.id;
      createdIds.authors.push(authorId);

      // Crear Libro 1 (precio 19.99 para prueba de decimales) y Libro 2 (precio 0.10).
      const book1Res = await adminClient.request('POST', '/books', {
        body: {
          title: `Cien Anios de Codigo ${suffix}`,
          isbn: '978-0-306-40615-7',
          salePrice: 19.99,
          categoryId,
          authorIds: [authorId],
        },
      });
      assert.equal(book1Res.status, 201);
      assert.equal(book1Res.body.data.stock.available, 0);
      bookOneId = book1Res.body.data.id;
      createdIds.books.push(bookOneId);

      const book2Res = await adminClient.request('POST', '/books', {
        body: {
          title: `Arquitectura Limpia ${suffix}`,
          isbn: '978-0-13-235088-4',
          salePrice: 0.1,
          categoryId,
          authorIds: [authorId],
        },
      });
      assert.equal(book2Res.status, 201);
      bookTwoId = book2Res.body.data.id;
      createdIds.books.push(bookTwoId);

      // Crear 4 copias disponibles para Libro 1 y 2 copias para Libro 2.
      for (let i = 1; i <= 4; i += 1) {
        const copyRes = await adminClient.request('POST', '/book-copies', {
          body: {
            bookId: bookOneId,
            barcode: `BC-B1-${suffix}-${i}`,
            physicalCondition: 'Good',
            status: 'Available',
          },
        });
        assert.equal(copyRes.status, 201);
        createdIds.copies.push(copyRes.body.data.id);
      }

      for (let i = 1; i <= 2; i += 1) {
        const copyRes = await adminClient.request('POST', '/book-copies', {
          body: {
            bookId: bookTwoId,
            barcode: `BC-B2-${suffix}-${i}`,
            physicalCondition: 'Good',
            status: 'Available',
          },
        });
        assert.equal(copyRes.status, 201);
        createdIds.copies.push(copyRes.body.data.id);
      }

      const checkBook1 = await adminClient.request('GET', `/books/${bookOneId}`);
      assert.equal(checkBook1.body.data.stock.available, 4);
    });
  });

  describe('Fase 3: Catálogo Público', () => {
    it('expone el catálogo público con filtros y oculta barcodes, stock mínimo e IDs de copias', async () => {
      const res = await anonymousHttp.request(
        'GET',
        `/catalog?categoryId=${categoryId}&availableOnly=true&sortBy=salePrice&order=desc`
      );
      assert.equal(res.status, 200);
      assert.ok(res.body.data.length >= 2);

      const item = res.body.data.find((b) => b.id === bookOneId);
      assert.ok(item);
      assert.equal(item.available, true);
      assert.equal(item.salePrice, 19.99);
      assert.equal(item.isbn, undefined);
      assert.equal(item.stock, undefined);
      assert.equal(item.barcode, undefined);
    });
  });

  describe('Fase 4: Motor de Préstamos (Salidas, Devoluciones, Overdue, Límite y Concurrencia)', () => {
    let loanOneId;
    let borrowedCopyIds = [];

    it('crea un préstamo con cliente inline (UoW), baja stock y cambia copias a Borrowed', async () => {
      const suffix = Date.now().toString().slice(-6);
      const res = await adminClient.request('POST', '/loans', {
        body: {
          client: {
            idCard: `6661${suffix}`,
            fullName: 'Cliente Inline Prestamo',
            email: `inline_loan_${suffix}@library.local`,
          },
          bookIds: [bookOneId, bookOneId],
        },
      });

      assert.equal(res.status, 201);
      assert.equal(res.headers.get('cache-control'), 'no-store');
      assert.ok(res.body.data.temporaryPassword);
      assert.equal(res.body.data.items.length, 2);

      loanOneId = res.body.data.id;
      clientTwoId = res.body.data.client.id;
      borrowedCopyIds = res.body.data.items.map((item) => item.copyId);
      createdIds.loans.push(loanOneId);
      createdIds.users.push(clientTwoId);

      // Login del segundo cliente para pruebas de Fase 6.
      const loginClient2 = await clientTwoHttp.request('POST', '/auth/login', {
        body: {
          email: `inline_loan_${suffix}@library.local`,
          password: res.body.data.temporaryPassword,
        },
      });
      assert.equal(loginClient2.status, 200);

      // El stock disponible de bookOne debe haber bajado de 4 a 2.
      const bookCheck = await adminClient.request('GET', `/books/${bookOneId}`);
      assert.equal(bookCheck.body.data.stock.available, 2);
    });

    it('ejecuta rollback completo si se supera el límite de copias activas por cliente', async () => {
      // clientTwoId ya tiene 2 copias activas; si pide 4 más (2 + 4 = 6 > límite 5), debe fallar con 409.
      const res = await adminClient.request('POST', '/loans', {
        body: {
          clientId: clientTwoId,
          bookIds: [bookOneId, bookOneId, bookTwoId, bookTwoId],
        },
      });
      assert.equal(res.status, 409);

      // Verificar que el stock de bookOne sigue en 2 y bookTwo sigue en 2 tras el rollback.
      const bookCheck = await adminClient.request('GET', `/books/${bookOneId}`);
      assert.equal(bookCheck.body.data.stock.available, 2);
    });

    it('deriva dinámicamente el estado Overdue sin crons cuando expected_return_date < CURDATE()', async () => {
      await pool.execute(
        'UPDATE loans SET expected_return_date = DATE_SUB(CURDATE(), INTERVAL 3 DAY) WHERE loan_id = ?',
        [loanOneId]
      );

      const getRes = await adminClient.request('GET', `/loans/${loanOneId}`);
      assert.equal(getRes.status, 200);
      assert.equal(getRes.body.data.status, 'Overdue');

      const filterRes = await adminClient.request('GET', '/loans?status=Overdue');
      assert.equal(filterRes.status, 200);
      assert.ok(filterRes.body.data.some((l) => l.id === loanOneId));
    });

    it('procesa devolución: copia Good sube stock (Available) y copia Poor pasa a Maintenance sin subir stock', async () => {
      const [copyGood, copyPoor] = borrowedCopyIds;
      const returnRes = await adminClient.request('POST', `/loans/${loanOneId}/return`, {
        body: {
          returns: [
            { copyId: copyGood, checkinCondition: 'Good' },
            { copyId: copyPoor, checkinCondition: 'Poor' },
          ],
        },
      });

      assert.equal(returnRes.status, 200);
      assert.equal(returnRes.body.data.status, 'Returned');
      assert.ok(returnRes.body.data.actualReturnDate);

      // Teníamos 2 disponibles + 1 devuelta en 'Good' = 3 disponibles (la 'Poor' quedó en Maintenance).
      const bookCheck = await adminClient.request('GET', `/books/${bookOneId}`);
      assert.equal(bookCheck.body.data.stock.available, 3);

      const copyPoorCheck = await adminClient.request('GET', `/book-copies/${copyPoor}`);
      assert.equal(copyPoorCheck.body.data.status, 'Maintenance');
    });

    it('controla concurrencia en préstamos simultáneos de la última copia disponible (SELECT ... FOR UPDATE)', async () => {
      // En bookTwoId hay 2 copias disponibles; si dos peticiones piden 2 copias al mismo tiempo, solo 1 debe triunfar.
      const [resA, resB] = await Promise.all([
        adminClient.request('POST', '/loans', {
          body: { clientId: clientOneId, bookIds: [bookTwoId, bookTwoId] },
        }),
        adminClient.request('POST', '/loans', {
          body: { clientId: clientTwoId, bookIds: [bookTwoId, bookTwoId] },
        }),
      ]);

      const statuses = [resA.status, resB.status].sort();
      assert.deepEqual(statuses, [201, 409]);

      const winner = resA.status === 201 ? resA : resB;
      createdIds.loans.push(winner.body.data.id);

      // Devolver las 2 copias de bookTwoId para dejarlas disponibles para las pruebas de compras.
      const winnerCopyIds = winner.body.data.items.map((i) => i.copyId);
      await adminClient.request('POST', `/loans/${winner.body.data.id}/return`, {
        body: {
          returns: winnerCopyIds.map((copyId) => ({ copyId, checkinCondition: 'Good' })),
        },
      });
    });
  });

  describe('Fase 5: Motor de Compras (Stock Insuficiente, Decimales y Concurrencia)', () => {
    it('rechaza con 409 sin cambios parciales cuando falta stock de uno de los libros', async () => {
      // bookOneId tiene 3 copias disponibles; pedimos 1 de bookTwoId y 10 de bookOneId.
      const res = await adminClient.request('POST', '/purchases', {
        body: {
          clientId: clientOneId,
          items: [
            { bookId: bookTwoId, quantity: 1 },
            { bookId: bookOneId, quantity: 10 },
          ],
        },
      });

      assert.equal(res.status, 409);
      assert.equal(res.body.details.bookId, bookOneId);
      assert.equal(res.body.details.available, 3);

      // Verificar que bookTwoId NO sufrió cambios parciales (sigue con 2 copias disponibles).
      const checkBook2 = await adminClient.request('GET', `/books/${bookTwoId}`);
      assert.equal(checkBook2.body.data.stock.available, 2);
    });

    it('suma libros repetidos y calcula total_amount con precisión decimal exacta', async () => {
      // Comprar 2 unidades de bookOneId (19.99 * 2 = 39.98) + 1 unidad de bookTwoId (0.10) = 40.08.
      const res = await adminClient.request('POST', '/purchases', {
        body: {
          clientId: clientOneId,
          items: [
            { bookId: bookOneId, quantity: 1 },
            { bookId: bookOneId, quantity: 1 },
            { bookId: bookTwoId, quantity: 1 },
          ],
        },
      });

      assert.equal(res.status, 201);
      assert.equal(res.body.data.totalAmount, 40.08);
      assert.equal(res.body.data.items.length, 2);
      createdIds.purchases.push(res.body.data.id);

      // Ahora queda 1 copia disponible de bookOneId y 1 copia disponible de bookTwoId.
      const checkBook1 = await adminClient.request('GET', `/books/${bookOneId}`);
      assert.equal(checkBook1.body.data.stock.available, 1);
    });

    it('controla concurrencia en compras simultáneas de la última copia disponible', async () => {
      // Queda 1 copia disponible de bookOneId; dos compras simultáneas de 1 unidad -> una 201 y otra 409.
      const [resA, resB] = await Promise.all([
        adminClient.request('POST', '/purchases', {
          body: { clientId: clientOneId, items: [{ bookId: bookOneId, quantity: 1 }] },
        }),
        adminClient.request('POST', '/purchases', {
          body: { clientId: clientTwoId, items: [{ bookId: bookOneId, quantity: 1 }] },
        }),
      ]);

      const statuses = [resA.status, resB.status].sort();
      assert.deepEqual(statuses, [201, 409]);

      const winner = resA.status === 201 ? resA : resB;
      createdIds.purchases.push(winner.body.data.id);
    });
  });

  describe('Fase 6: Endpoints del Cliente (/api/v1/me/*)', () => {
    it('bloquea con 403 al rol Administrator en cualquier endpoint /me/*', async () => {
      const resLoans = await adminClient.request('GET', '/me/loans');
      assert.equal(resLoans.status, 403);

      const resPurchases = await adminClient.request('GET', '/me/purchases');
      assert.equal(resPurchases.status, 403);
    });

    it('permite al cliente ver sus propios préstamos y compras y devuelve 404 si pide datos de otro cliente', async () => {
      const myPurchases = await clientOneHttp.request('GET', '/me/purchases');
      assert.equal(myPurchases.status, 200);
      assert.ok(myPurchases.body.data.length >= 1);

      const firstPurchaseId = myPurchases.body.data[0].id;
      const ownPurchaseDetail = await clientOneHttp.request(
        'GET',
        `/me/purchases/${firstPurchaseId}`
      );
      assert.equal(ownPurchaseDetail.status, 200);

      // Si clientTwo pide la compra de clientOne, debe recibir 404 Not Found.
      const foreignPurchaseDetail = await clientTwoHttp.request(
        'GET',
        `/me/purchases/${firstPurchaseId}`
      );
      assert.equal(foreignPurchaseDetail.status, 404);

      // Si clientOne pide el préstamo de clientTwo, debe recibir 404 Not Found.
      const clientTwoLoans = await clientTwoHttp.request('GET', '/me/loans');
      assert.equal(clientTwoLoans.status, 200);
      const clientTwoLoanId = clientTwoLoans.body.data[0].id;

      const foreignLoanDetail = await clientOneHttp.request(
        'GET',
        `/me/loans/${clientTwoLoanId}`
      );
      assert.equal(foreignLoanDetail.status, 404);
    });
  });
});
