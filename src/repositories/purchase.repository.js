// Gestiona compras y sus detalles en lote sin consultas N+1 y con soporte de conexión UoW.
export default class PurchaseRepository {
  #pool;
  #baseSelect;

  constructor(pool) {
    this.#pool = pool;
    this.#baseSelect = `
      SELECT p.purchase_id, p.purchase_date, p.total_amount,
             p.client_id, u.full_name AS client_name, u.email AS client_email,
             p.admin_id
      FROM purchases p
      INNER JOIN users u ON u.user_id = p.client_id
    `;
  }

  async createPurchase({ totalAmount, clientId, adminId }, executor = this.#pool) {
    const [result] = await executor.execute(
      `INSERT INTO purchases (total_amount, client_id, admin_id)
       VALUES (?, ?, ?)`,
      [totalAmount, clientId, adminId]
    );
    return result.insertId;
  }

  async createPurchaseDetails(purchaseId, items, executor = this.#pool) {
    if (!Array.isArray(items) || items.length === 0) return;
    const rows = items.map((item) => [
      item.quantity,
      item.unitPrice,
      purchaseId,
      item.bookId,
    ]);
    await executor.query(
      'INSERT INTO purchase_details (quantity, unit_price, purchase_id, book_id) VALUES ?',
      [rows]
    );
  }

  async findById(purchaseId, executor = this.#pool) {
    const [rows] = await executor.execute(
      `${this.#baseSelect} WHERE p.purchase_id = ?`,
      [purchaseId]
    );
    if (rows.length === 0) return null;
    const [purchase] = await this.#attachDetails(rows, executor);
    return purchase;
  }

  async findAll({ clientId, limit, offset }, executor = this.#pool) {
    const conditions = [];
    const params = [];

    if (clientId !== undefined) {
      conditions.push('p.client_id = ?');
      params.push(Number(clientId));
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const [rows] = await executor.query(
      `${this.#baseSelect}
       ${whereClause}
       ORDER BY p.purchase_id DESC
       LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );
    return this.#attachDetails(rows, executor);
  }

  async count({ clientId } = {}, executor = this.#pool) {
    const conditions = [];
    const params = [];

    if (clientId !== undefined) {
      conditions.push('client_id = ?');
      params.push(Number(clientId));
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const [[{ total }]] = await executor.query(
      `SELECT COUNT(*) AS total FROM purchases ${whereClause}`,
      params
    );
    return total;
  }

  async #attachDetails(purchases, executor = this.#pool) {
    if (purchases.length === 0) return purchases;

    const [detailRows] = await executor.query(
      `SELECT pd.purchase_detail_id, pd.purchase_id, pd.book_id,
              pd.quantity, pd.unit_price, b.title AS book_title
       FROM purchase_details pd
       INNER JOIN books b ON b.book_id = pd.book_id
       WHERE pd.purchase_id IN (?)
       ORDER BY pd.purchase_detail_id ASC`,
      [purchases.map((purchase) => purchase.purchase_id)]
    );

    const detailsByPurchase = new Map();
    for (const detail of detailRows) {
      if (!detailsByPurchase.has(detail.purchase_id)) {
        detailsByPurchase.set(detail.purchase_id, []);
      }
      detailsByPurchase.get(detail.purchase_id).push(detail);
    }

    return purchases.map((purchase) => ({
      ...purchase,
      details: detailsByPurchase.get(purchase.purchase_id) ?? [],
    }));
  }
}
