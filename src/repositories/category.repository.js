// Gestiona las consultas de categorías soportando el pool por defecto o una conexión transaccional (UoW).
export default class CategoryRepository {
  #pool;

  constructor(pool) {
    this.#pool = pool;
  }

  async findAll(executor = this.#pool) {
    const [rows] = await executor.query(
      'SELECT category_id, category_name FROM categories ORDER BY category_name'
    );
    return rows;
  }

  async findById(id, executor = this.#pool) {
    const [rows] = await executor.execute(
      'SELECT category_id, category_name FROM categories WHERE category_id = ?',
      [id]
    );
    return rows[0] ?? null;
  }

  async findByName(name, executor = this.#pool) {
    const [rows] = await executor.execute(
      'SELECT category_id, category_name FROM categories WHERE category_name = ?',
      [name]
    );
    return rows[0] ?? null;
  }

  async create(name, executor = this.#pool) {
    const [result] = await executor.execute(
      'INSERT INTO categories (category_name) VALUES (?)',
      [name]
    );
    return result.insertId;
  }

  async update(id, name, executor = this.#pool) {
    const [result] = await executor.execute(
      'UPDATE categories SET category_name = ? WHERE category_id = ?',
      [name, id]
    );
    return result.affectedRows;
  }

  async delete(id, executor = this.#pool) {
    const [result] = await executor.execute(
      'DELETE FROM categories WHERE category_id = ?',
      [id]
    );
    return result.affectedRows;
  }
}
