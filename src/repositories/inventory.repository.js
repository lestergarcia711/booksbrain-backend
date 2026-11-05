// Gestiona el inventario de libros aceptando el pool por defecto o una conexión transaccional (UoW).
export default class InventoryRepository {
  #pool;

  constructor(pool) {
    this.#pool = pool;
  }

  async createForBook(bookId, availableStock = 0, minimumStock = 5, executor = this.#pool) {
    const [result] = await executor.execute(
      'INSERT INTO inventory (book_id, available_stock, minimum_stock) VALUES (?, ?, ?)',
      [bookId, availableStock, minimumStock]
    );
    return result.insertId;
  }

  async findByBookId(bookId, executor = this.#pool) {
    const [rows] = await executor.execute(
      'SELECT inventory_id, book_id, available_stock, minimum_stock FROM inventory WHERE book_id = ?',
      [bookId]
    );
    return rows[0] ?? null;
  }

  async adjustAvailableStock(bookId, delta, executor = this.#pool) {
    const [result] = await executor.execute(
      'UPDATE inventory SET available_stock = GREATEST(0, available_stock + ?) WHERE book_id = ?',
      [Number(delta), bookId]
    );
    return result.affectedRows;
  }
}
