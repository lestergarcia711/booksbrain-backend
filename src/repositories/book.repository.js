// Los autores (N:M) se cargan aparte en #attachAuthors para no multiplicar filas en el SELECT principal.
const BOOK_SELECT = `
  SELECT b.book_id, b.title, b.isbn, b.sale_price,
         b.category_id, c.category_name,
         i.available_stock, i.minimum_stock
  FROM books b
  INNER JOIN categories c ON c.category_id = b.category_id
  LEFT JOIN inventory i ON i.book_id = b.book_id
`;

const UPDATABLE_COLUMNS = {
  title: 'title',
  isbn: 'isbn',
  salePrice: 'sale_price',
  categoryId: 'category_id',
};

export default class BookRepository {
  #pool;

  constructor(pool) {
    this.#pool = pool;
  }

  async findAll({ limit, offset }) {
    const [rows] = await this.#pool.query(
      `${BOOK_SELECT} ORDER BY b.title LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    return this.#attachAuthors(rows);
  }

  async count() {
    const [[{ total }]] = await this.#pool.query('SELECT COUNT(*) AS total FROM books');
    return total;
  }

  async findById(id) {
    const [rows] = await this.#pool.execute(`${BOOK_SELECT} WHERE b.book_id = ?`, [id]);
    if (rows.length === 0) return null;
    const [book] = await this.#attachAuthors(rows);
    return book;
  }

  async findByIsbn(isbn) {
    const [rows] = await this.#pool.execute('SELECT book_id FROM books WHERE isbn = ?', [isbn]);
    return rows[0] ?? null;
  }

  async create({ title, isbn, salePrice, categoryId, authorIds }) {
    return this.#inTransaction(async (connection) => {
      const [result] = await connection.execute(
        'INSERT INTO books (title, isbn, sale_price, category_id) VALUES (?, ?, ?, ?)',
        [title, isbn, salePrice, categoryId]
      );
      const bookId = result.insertId;

      await this.#insertAuthors(connection, bookId, authorIds);
      await connection.execute('INSERT INTO inventory (book_id) VALUES (?)', [bookId]);

      return bookId;
    });
  }

  async update(id, { fields, authorIds }) {
    const entries = Object.entries(fields).filter(([key]) =>
      Object.hasOwn(UPDATABLE_COLUMNS, key)
    );

    return this.#inTransaction(async (connection) => {
      if (entries.length > 0) {
        const setClause = entries.map(([key]) => `${UPDATABLE_COLUMNS[key]} = ?`).join(', ');
        await connection.execute(
          `UPDATE books SET ${setClause} WHERE book_id = ?`,
          [...entries.map(([, value]) => value), id]
        );
      }

      if (authorIds !== undefined) {
        // Reemplazo completo: borra los vínculos actuales y asocia la nueva lista completa.
        await connection.execute('DELETE FROM book_authors WHERE book_id = ?', [id]);
        await this.#insertAuthors(connection, id, authorIds);
      }
    });
  }

  async delete(id) {
    // ON DELETE CASCADE en la base de datos elimina automáticamente book_authors, inventory y book_copies.
    await this.#pool.execute('DELETE FROM books WHERE book_id = ?', [id]);
  }

  async #inTransaction(work) {
    const connection = await this.#pool.getConnection();
    try {
      await connection.beginTransaction();
      const result = await work(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async #insertAuthors(connection, bookId, authorIds) {
    const rows = authorIds.map((authorId) => [bookId, authorId]);
    await connection.query('INSERT INTO book_authors (book_id, author_id) VALUES ?', [rows]);
  }

  // Estrategia de carga diferida (Eager Loading manual) para evitar problemas de rendimiento N+1.
  async #attachAuthors(books) {
    if (books.length === 0) return books;

    const [authorRows] = await this.#pool.query(
      `SELECT ba.book_id, a.author_id, a.full_name
       FROM book_authors ba
       INNER JOIN authors a ON a.author_id = ba.author_id
       WHERE ba.book_id IN (?)
       ORDER BY a.full_name`,
      [books.map((book) => book.book_id)]
    );

    const authorsByBook = new Map();
    for (const { book_id, author_id, full_name } of authorRows) {
      if (!authorsByBook.has(book_id)) authorsByBook.set(book_id, []);
      authorsByBook.get(book_id).push({ author_id, full_name });
    }

    return books.map((book) => ({ ...book, authors: authorsByBook.get(book.book_id) ?? [] }));
  }
}
