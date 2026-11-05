// Gestiona las consultas de autores aceptando el pool por defecto o una conexión transaccional (UoW).
export default class AuthorRepository {
  #pool;

  constructor(pool) {
    this.#pool = pool;
  }

  async findAll(executor = this.#pool) {
    const [rows] = await executor.query(
      'SELECT author_id, full_name FROM authors ORDER BY full_name'
    );
    return rows;
  }

  async findById(id, executor = this.#pool) {
    const [rows] = await executor.execute(
      'SELECT author_id, full_name FROM authors WHERE author_id = ?',
      [id]
    );
    return rows[0] ?? null;
  }

  async findByName(name, executor = this.#pool) {
    const [rows] = await executor.execute(
      'SELECT author_id, full_name FROM authors WHERE full_name = ?',
      [name]
    );
    return rows[0] ?? null;
  }

  async create(name, executor = this.#pool) {
    const [result] = await executor.execute(
      'INSERT INTO authors (full_name) VALUES (?)',
      [name]
    );
    return result.insertId;
  }

  async update(id, fullName, executor = this.#pool) {
    const [result] = await executor.execute(
      'UPDATE authors SET full_name = ? WHERE author_id = ?',
      [fullName, id]
    );
    return result.affectedRows;
  }

  async delete(id, executor = this.#pool) {
    const [result] = await executor.execute(
      'DELETE FROM authors WHERE author_id = ?',
      [id]
    );
    return result.affectedRows;
  }

  async findByIds(ids, executor = this.#pool) {
    if (!Array.isArray(ids) || ids.length === 0) {
      return [];
    }
    const [rows] = await executor.query(
      'SELECT author_id, full_name FROM authors WHERE author_id IN (?)',
      [ids]
    );
    return rows;
  }
}
