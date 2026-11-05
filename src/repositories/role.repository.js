// Gestiona las consultas de roles aceptando el pool por defecto o una conexión transaccional (UoW).
export default class RoleRepository {
  #pool;

  constructor(pool) {
    this.#pool = pool;
  }

  async findAll(executor = this.#pool) {
    const [rows] = await executor.query(
      'SELECT role_id, role_name FROM roles ORDER BY role_name'
    );
    return rows;
  }

  async findById(id, executor = this.#pool) {
    const [rows] = await executor.execute(
      'SELECT role_id, role_name FROM roles WHERE role_id = ?',
      [id]
    );
    return rows[0] ?? null;
  }

  async findByName(roleName, executor = this.#pool) {
    const [rows] = await executor.execute(
      'SELECT role_id, role_name FROM roles WHERE role_name = ?',
      [roleName]
    );
    return rows[0] ?? null;
  }
}
