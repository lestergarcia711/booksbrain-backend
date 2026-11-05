import { ConflictError } from '../errors/http.errors.js';

// Coordina transacciones atómicas en MySQL abriendo una conexión, ejecutando commit/rollback y garantizando release().
export default class UnitOfWork {
  #pool;
  #deadlockCodes;

  constructor(pool) {
    this.#pool = pool;
    this.#deadlockCodes = new Set(['ER_LOCK_DEADLOCK', 'ER_LOCK_WAIT_TIMEOUT']);
  }

  async execute(work) {
    const connection = await this.#pool.getConnection();
    try {
      await connection.beginTransaction();
      const result = await work(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      if (this.#deadlockCodes.has(error?.code) || error?.errno === 1213 || error?.errno === 1205) {
        throw new ConflictError(
          'Conflicto de concurrencia al procesar la transaccion. Por favor intenta nuevamente'
        );
      }
      throw error;
    } finally {
      connection.release();
    }
  }
}
