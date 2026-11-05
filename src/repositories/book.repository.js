// Gestiona las consultas de libros y catálogo público aceptando el pool o una conexión transaccional (UoW).
export default class BookRepository {
  #pool;
  #bookSelect;
  #updatableColumns;
  #catalogSortColumns;

  constructor(pool) {
    this.#pool = pool;
    this.#bookSelect = `
      SELECT b.book_id, b.title, b.isbn, b.sale_price,
             b.category_id, c.category_name,
             COALESCE(i.available_stock, 0) AS available_stock,
             COALESCE(i.minimum_stock, 5) AS minimum_stock
      FROM books b
      INNER JOIN categories c ON c.category_id = b.category_id
      LEFT JOIN inventory i ON i.book_id = b.book_id
    `;
    this.#updatableColumns = {
      title: 'title',
      isbn: 'isbn',
      salePrice: 'sale_price',
      categoryId: 'category_id',
    };
    this.#catalogSortColumns = {
      title: 'b.title',
      salePrice: 'b.sale_price',
    };
  }

  async findAll({ limit, offset }, executor = this.#pool) {
    const [rows] = await executor.query(
      `${this.#bookSelect} ORDER BY b.title LIMIT ? OFFSET ?`,
      [Number(limit), Number(offset)]
    );
    return this.#attachAuthors(rows, executor);
  }

  async count(executor = this.#pool) {
    const [[{ total }]] = await executor.query('SELECT COUNT(*) AS total FROM books');
    return total;
  }

  async findById(id, executor = this.#pool) {
    const [rows] = await executor.execute(`${this.#bookSelect} WHERE b.book_id = ?`, [id]);
    if (rows.length === 0) return null;
    const [book] = await this.#attachAuthors(rows, executor);
    return book;
  }

  async findByIsbn(isbn, executor = this.#pool) {
    const [rows] = await executor.execute(
      'SELECT book_id FROM books WHERE isbn = ?',
      [isbn]
    );
    return rows[0] ?? null;
  }

  async createRecord({ title, isbn, salePrice, categoryId }, executor = this.#pool) {
    const [result] = await executor.execute(
      'INSERT INTO books (title, isbn, sale_price, category_id) VALUES (?, ?, ?, ?)',
      [title, isbn, salePrice, categoryId]
    );
    return result.insertId;
  }

  async replaceAuthors(bookId, authorIds, executor = this.#pool) {
    await executor.execute('DELETE FROM book_authors WHERE book_id = ?', [bookId]);
    if (Array.isArray(authorIds) && authorIds.length > 0) {
      const rows = authorIds.map((authorId) => [bookId, authorId]);
      await executor.query('INSERT INTO book_authors (book_id, author_id) VALUES ?', [rows]);
    }
  }

  async updateFields(id, fields, executor = this.#pool) {
    const entries = Object.entries(fields).filter(([key]) =>
      Object.hasOwn(this.#updatableColumns, key)
    );
    if (entries.length === 0) return;

    const setClause = entries.map(([key]) => `${this.#updatableColumns[key]} = ?`).join(', ');
    await executor.execute(
      `UPDATE books SET ${setClause} WHERE book_id = ?`,
      [...entries.map(([, value]) => value), id]
    );
  }

  async delete(id, executor = this.#pool) {
    await executor.execute('DELETE FROM books WHERE book_id = ?', [id]);
  }

  // Consulta filtrada y ordenada para el catálogo público sin consultas N+1.
  async findCatalog(
    { search, categoryId, authorId, availableOnly, sortBy = 'title', order = 'asc', limit, offset },
    executor = this.#pool
  ) {
    const { whereClause, params } = this.#buildCatalogFilters({
      search,
      categoryId,
      authorId,
      availableOnly,
    });

    const sortColumn = this.#catalogSortColumns[sortBy] ?? 'b.title';
    const sortDirection = String(order).toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    const [rows] = await executor.query(
      `${this.#bookSelect}
       ${whereClause}
       ORDER BY ${sortColumn} ${sortDirection}, b.book_id ASC
       LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );

    return this.#attachAuthors(rows, executor);
  }

  async countCatalog({ search, categoryId, authorId, availableOnly }, executor = this.#pool) {
    const { whereClause, params } = this.#buildCatalogFilters({
      search,
      categoryId,
      authorId,
      availableOnly,
    });

    const [[{ total }]] = await executor.query(
      `SELECT COUNT(*) AS total
       FROM books b
       INNER JOIN categories c ON c.category_id = b.category_id
       LEFT JOIN inventory i ON i.book_id = b.book_id
       ${whereClause}`,
      params
    );
    return total;
  }

  #buildCatalogFilters({ search, categoryId, authorId, availableOnly }) {
    const conditions = [];
    const params = [];

    if (search) {
      const pattern = `%${search}%`;
      conditions.push(
        `(b.title LIKE ? OR EXISTS (
          SELECT 1
          FROM book_authors ba_s
          INNER JOIN authors a_s ON a_s.author_id = ba_s.author_id
          WHERE ba_s.book_id = b.book_id AND a_s.full_name LIKE ?
        ))`
      );
      params.push(pattern, pattern);
    }

    if (categoryId !== undefined) {
      conditions.push('b.category_id = ?');
      params.push(Number(categoryId));
    }

    if (authorId !== undefined) {
      conditions.push(
        `EXISTS (
          SELECT 1
          FROM book_authors ba_f
          WHERE ba_f.book_id = b.book_id AND ba_f.author_id = ?
        )`
      );
      params.push(Number(authorId));
    }

    if (availableOnly === true) {
      conditions.push('COALESCE(i.available_stock, 0) > 0');
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    return { whereClause, params };
  }

  // Carga los autores en lote para todos los libros consultados evitando el problema N+1.
  async #attachAuthors(books, executor = this.#pool) {
    if (books.length === 0) return books;

    const [authorRows] = await executor.query(
      `SELECT ba.book_id, a.author_id, a.full_name
       FROM book_authors ba
       INNER JOIN authors a ON a.author_id = ba.author_id
       WHERE ba.book_id IN (?)
       ORDER BY a.full_name`,
      [books.map((book) => book.book_id)]
    );

    const authorsByBook = new Map();
    for (const { book_id, author_id, full_name } of authorRows) {
      if (!authorsByBook.has(book_id)) {
        authorsByBook.set(book_id, []);
      }
      authorsByBook.get(book_id).push({ author_id, full_name });
    }

    return books.map((book) => ({
      ...book,
      authors: authorsByBook.get(book.book_id) ?? [],
    }));
  }
}
