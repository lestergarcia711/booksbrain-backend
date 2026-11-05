// Gestiona la persistencia de usuarios omitiendo la contraseña salvo en el método exclusivo de login.
export default class UserRepository {
  #pool;
  #baseSelect;
  #updatableColumns;

  constructor(pool) {
    this.#pool = pool;
    this.#baseSelect = `
      SELECT u.user_id, u.id_card, u.full_name, u.phone, u.address, u.email, u.role_id, r.role_name
      FROM users u
      INNER JOIN roles r ON r.role_id = u.role_id
    `;
    this.#updatableColumns = {
      fullName: 'full_name',
      phone: 'phone',
      address: 'address',
      email: 'email',
    };
  }

  async findAll({ limit, offset }, executor = this.#pool) {
    const [rows] = await executor.query(
      `${this.#baseSelect} ORDER BY u.user_id LIMIT ? OFFSET ?`,
      [Number(limit), Number(offset)]
    );
    return rows;
  }

  async count(executor = this.#pool) {
    const [[{ total }]] = await executor.query('SELECT COUNT(*) AS total FROM users');
    return total;
  }

  async findById(id, executor = this.#pool) {
    const [rows] = await executor.execute(`${this.#baseSelect} WHERE u.user_id = ?`, [id]);
    return rows[0] ?? null;
  }

  async findByEmail(email, executor = this.#pool) {
    const [rows] = await executor.execute(`${this.#baseSelect} WHERE u.email = ?`, [email]);
    return rows[0] ?? null;
  }

  async findByIdCard(idCard, executor = this.#pool) {
    const [rows] = await executor.execute(`${this.#baseSelect} WHERE u.id_card = ?`, [idCard]);
    return rows[0] ?? null;
  }

  // Exclusivo para el flujo de login: es el único método de búsqueda por correo que incluye password.
  async findByEmailWithPassword(email, executor = this.#pool) {
    const [rows] = await executor.execute(
      `SELECT u.user_id, u.id_card, u.full_name, u.phone, u.address, u.email, u.password, u.role_id, r.role_name
       FROM users u
       INNER JOIN roles r ON r.role_id = u.role_id
       WHERE u.email = ?`,
      [email]
    );
    return rows[0] ?? null;
  }

  async findByIdWithPassword(id, executor = this.#pool) {
    const [rows] = await executor.execute(
      'SELECT u.user_id, u.password FROM users u WHERE u.user_id = ?',
      [id]
    );
    return rows[0] ?? null;
  }

  async create({ idCard, fullName, phone, address, email, password, roleId }, executor = this.#pool) {
    const [result] = await executor.execute(
      `INSERT INTO users (id_card, full_name, phone, address, email, password, role_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [idCard, fullName, phone ?? null, address ?? null, email, password, roleId]
    );
    return result.insertId;
  }

  async update(id, fields, executor = this.#pool) {
    const entries = Object.entries(fields).filter(([key]) =>
      Object.hasOwn(this.#updatableColumns, key)
    );
    if (entries.length === 0) return;

    const setClause = entries.map(([key]) => `${this.#updatableColumns[key]} = ?`).join(', ');
    const values = entries.map(([, value]) => value);

    await executor.execute(
      `UPDATE users SET ${setClause} WHERE user_id = ?`,
      [...values, id]
    );
  }

  async updatePassword(id, hashedPassword, executor = this.#pool) {
    const [result] = await executor.execute(
      'UPDATE users SET password = ? WHERE user_id = ?',
      [hashedPassword, id]
    );
    return result.affectedRows;
  }

  async delete(id, executor = this.#pool) {
    await executor.execute('DELETE FROM users WHERE user_id = ?', [id]);
  }
}
