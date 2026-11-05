// Gestiona préstamos y sus detalles derivando dinámicamente el estado 'Overdue' sin consultas N+1.
export default class LoanRepository {
  #pool;
  #baseSelect;

  constructor(pool) {
    this.#pool = pool;
    this.#baseSelect = `
      SELECT l.loan_id, l.loan_date, l.expected_return_date, l.actual_return_date,
             l.status,
             CASE
               WHEN l.status = 'Active' AND l.expected_return_date < CURDATE() THEN 'Overdue'
               ELSE l.status
             END AS effective_status,
             l.client_id, u.full_name AS client_name, u.email AS client_email,
             l.admin_id
      FROM loans l
      INNER JOIN users u ON u.user_id = l.client_id
    `;
  }

  async getDefaultReturnDate(days, executor = this.#pool) {
    const [[{ expectedDate }]] = await executor.query(
      'SELECT DATE_ADD(CURDATE(), INTERVAL ? DAY) AS expectedDate',
      [Number(days)]
    );
    return expectedDate;
  }

  async getCurrentDate(executor = this.#pool) {
    const [[{ today }]] = await executor.query('SELECT CURDATE() AS today');
    return today;
  }

  async countActiveCopiesByClient(clientId, executor = this.#pool) {
    const [[{ activeCount }]] = await executor.execute(
      `SELECT COUNT(*) AS activeCount
       FROM loan_details ld
       INNER JOIN loans l ON l.loan_id = ld.loan_id
       WHERE l.client_id = ?
         AND l.status IN ('Active', 'Overdue')
         AND ld.checkin_condition IS NULL`,
      [clientId]
    );
    return Number(activeCount);
  }

  async createLoan({ clientId, adminId, expectedReturnDate }, executor = this.#pool) {
    const [result] = await executor.execute(
      `INSERT INTO loans (expected_return_date, status, client_id, admin_id)
       VALUES (?, 'Active', ?, ?)`,
      [expectedReturnDate, clientId, adminId]
    );
    return result.insertId;
  }

  async createLoanDetails(loanId, items, executor = this.#pool) {
    if (!Array.isArray(items) || items.length === 0) return;
    const rows = items.map((item) => [item.checkoutCondition, loanId, item.copyId]);
    await executor.query(
      'INSERT INTO loan_details (checkout_condition, loan_id, copy_id) VALUES ?',
      [rows]
    );
  }

  async findById(loanId, executor = this.#pool) {
    const [rows] = await executor.execute(
      `${this.#baseSelect} WHERE l.loan_id = ?`,
      [loanId]
    );
    if (rows.length === 0) return null;
    const [loan] = await this.#attachDetails(rows, executor);
    return loan;
  }

  async findAll({ clientId, status, limit, offset }, executor = this.#pool) {
    const { whereClause, params } = this.#buildFilters({ clientId, status });
    const [rows] = await executor.query(
      `${this.#baseSelect}
       ${whereClause}
       ORDER BY l.loan_id DESC
       LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );
    return this.#attachDetails(rows, executor);
  }

  async count({ clientId, status } = {}, executor = this.#pool) {
    const { whereClause, params } = this.#buildFilters({ clientId, status });
    const [[{ total }]] = await executor.query(
      `SELECT COUNT(*) AS total
       FROM loans l
       ${whereClause}`,
      params
    );
    return total;
  }

  // Bloquea el préstamo para actualización durante el flujo de devolución.
  async lockLoanById(loanId, executor = this.#pool) {
    const [rows] = await executor.execute(
      'SELECT loan_id, status, client_id, admin_id FROM loans WHERE loan_id = ? FOR UPDATE',
      [loanId]
    );
    return rows[0] ?? null;
  }

  // Bloquea los detalles del préstamo ordenando por copy_id ASC para evitar deadlocks.
  async lockLoanDetailsByLoanId(loanId, executor = this.#pool) {
    const [rows] = await executor.execute(
      `SELECT ld.loan_detail_id, ld.checkout_condition, ld.checkin_condition,
              ld.loan_id, ld.copy_id, bc.book_id
       FROM loan_details ld
       INNER JOIN book_copies bc ON bc.copy_id = ld.copy_id
       WHERE ld.loan_id = ?
       ORDER BY ld.copy_id ASC
       FOR UPDATE`,
      [loanId]
    );
    return rows;
  }

  async updateDetailCheckin(loanDetailId, checkinCondition, executor = this.#pool) {
    await executor.execute(
      'UPDATE loan_details SET checkin_condition = ? WHERE loan_detail_id = ?',
      [checkinCondition, loanDetailId]
    );
  }

  async markAsReturned(loanId, executor = this.#pool) {
    await executor.execute(
      `UPDATE loans
       SET status = 'Returned', actual_return_date = CURDATE()
       WHERE loan_id = ?`,
      [loanId]
    );
  }

  #buildFilters({ clientId, status }) {
    const conditions = [];
    const params = [];

    if (clientId !== undefined) {
      conditions.push('l.client_id = ?');
      params.push(Number(clientId));
    }

    if (status === 'Overdue') {
      conditions.push("(l.status = 'Overdue' OR (l.status = 'Active' AND l.expected_return_date < CURDATE()))");
    } else if (status === 'Active') {
      conditions.push("(l.status = 'Active' AND l.expected_return_date >= CURDATE())");
    } else if (status === 'Returned') {
      conditions.push("l.status = 'Returned'");
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    return { whereClause, params };
  }

  async #attachDetails(loans, executor = this.#pool) {
    if (loans.length === 0) return loans;

    const [detailRows] = await executor.query(
      `SELECT ld.loan_detail_id, ld.loan_id, ld.copy_id,
              ld.checkout_condition, ld.checkin_condition,
              bc.barcode, bc.book_id, b.title AS book_title
       FROM loan_details ld
       INNER JOIN book_copies bc ON bc.copy_id = ld.copy_id
       INNER JOIN books b ON b.book_id = bc.book_id
       WHERE ld.loan_id IN (?)
       ORDER BY ld.loan_detail_id ASC`,
      [loans.map((loan) => loan.loan_id)]
    );

    const detailsByLoan = new Map();
    for (const detail of detailRows) {
      if (!detailsByLoan.has(detail.loan_id)) {
        detailsByLoan.set(detail.loan_id, []);
      }
      detailsByLoan.get(detail.loan_id).push(detail);
    }

    return loans.map((loan) => ({
      ...loan,
      details: detailsByLoan.get(loan.loan_id) ?? [],
    }));
  }
}
