// Gestiona los ejemplares físicos (book_copies) y el bloqueo pesimista (SELECT ... FOR UPDATE) para UoW.
export default class BookCopyRepository {
  #pool;
  #baseSelect;
  #updatableColumns;

  constructor(pool) {
    this.#pool = pool;
    this.#baseSelect = `
      SELECT bc.copy_id, bc.barcode, bc.physical_condition, bc.status, bc.book_id, b.title AS book_title
      FROM book_copies bc
      INNER JOIN books b ON b.book_id = bc.book_id
    `;
    this.#updatableColumns = {
      barcode: 'barcode',
      physicalCondition: 'physical_condition',
      status: 'status',
    };
  }

  async findAll({ bookId, status, limit, offset }, executor = this.#pool) {
    const conditions = [];
    const params = [];

    if (bookId !== undefined) {
      conditions.push('bc.book_id = ?');
      params.push(Number(bookId));
    }
    if (status !== undefined) {
      conditions.push('bc.status = ?');
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const [rows] = await executor.query(
      `${this.#baseSelect} ${whereClause} ORDER BY bc.copy_id ASC LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );
    return rows;
  }

  async count({ bookId, status } = {}, executor = this.#pool) {
    const conditions = [];
    const params = [];

    if (bookId !== undefined) {
      conditions.push('book_id = ?');
      params.push(Number(bookId));
    }
    if (status !== undefined) {
      conditions.push('status = ?');
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const [[{ total }]] = await executor.query(
      `SELECT COUNT(*) AS total FROM book_copies ${whereClause}`,
      params
    );
    return total;
  }

  async findById(id, executor = this.#pool) {
    const [rows] = await executor.execute(
      `${this.#baseSelect} WHERE bc.copy_id = ?`,
      [id]
    );
    return rows[0] ?? null;
  }

  async findByBarcode(barcode, executor = this.#pool) {
    const [rows] = await executor.execute(
      'SELECT copy_id, barcode, book_id, status FROM book_copies WHERE barcode = ?',
      [barcode]
    );
    return rows[0] ?? null;
  }

  async create({ bookId, barcode, physicalCondition, status }, executor = this.#pool) {
    const [result] = await executor.execute(
      `INSERT INTO book_copies (book_id, barcode, physical_condition, status)
       VALUES (?, ?, ?, ?)`,
      [bookId, barcode, physicalCondition ?? 'Good', status ?? 'Available']
    );
    return result.insertId;
  }

  async update(id, fields, executor = this.#pool) {
    const entries = Object.entries(fields).filter(([key]) =>
      Object.hasOwn(this.#updatableColumns, key)
    );
    if (entries.length === 0) return;

    const setClause = entries.map(([key]) => `${this.#updatableColumns[key]} = ?`).join(', ');
    await executor.execute(
      `UPDATE book_copies SET ${setClause} WHERE copy_id = ?`,
      [...entries.map(([, value]) => value), id]
    );
  }

  async delete(id, executor = this.#pool) {
    await executor.execute('DELETE FROM book_copies WHERE copy_id = ?', [id]);
  }

  // Bloquea con FOR UPDATE las copias disponibles de un libro ordenando por copy_id ASC (evita deadlocks).
  async lockAvailableByBookId(bookId, quantity, executor = this.#pool) {
    const [rows] = await executor.query(
      `SELECT copy_id, barcode, physical_condition, status, book_id
       FROM book_copies
       WHERE book_id = ? AND status = 'Available'
       ORDER BY copy_id ASC
       LIMIT ?
       FOR UPDATE`,
      [Number(bookId), Number(quantity)]
    );
    return rows;
  }

  // Bloquea con FOR UPDATE un conjunto de copias específicas ordenando por copy_id ASC.
  async lockByIds(copyIds, executor = this.#pool) {
    if (!Array.isArray(copyIds) || copyIds.length === 0) return [];
    const sortedIds = [...copyIds].map(Number).sort((a, b) => a - b);
    const [rows] = await executor.query(
      `SELECT copy_id, barcode, physical_condition, status, book_id
       FROM book_copies
       WHERE copy_id IN (?)
       ORDER BY copy_id ASC
       FOR UPDATE`,
      [sortedIds]
    );
    return rows;
  }

  async updateStatusByIds(copyIds, newStatus, executor = this.#pool) {
    if (!Array.isArray(copyIds) || copyIds.length === 0) return;
    await executor.query(
      'UPDATE book_copies SET status = ? WHERE copy_id IN (?)',
      [newStatus, copyIds]
    );
  }

  async updateConditionAndStatus(copyId, physicalCondition, status, executor = this.#pool) {
    await executor.execute(
      'UPDATE book_copies SET physical_condition = ?, status = ? WHERE copy_id = ?',
      [physicalCondition, status, copyId]
    );
  }
}
