import mysql from 'mysql2/promise';
import { env } from './env.config.js';

// Encapsula el pool de conexiones a MySQL con soporte para dateStrings.
export default class DatabaseConfig {
  #pool;

  constructor(dbConfig) {
    this.#pool = mysql.createPool({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database,
      waitForConnections: true,
      connectionLimit: 10,
      dateStrings: true,
    });
  }

  get pool() {
    return this.#pool;
  }
}

export const databaseConfig = new DatabaseConfig(env.db);
export const pool = databaseConfig.pool;
