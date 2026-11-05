import app from './app.js';
import { env } from './config/env.config.js';
import { pool } from './config/database.config.js';

// Gestiona el ciclo de vida del servidor HTTP y el cierre limpio del pool de MySQL.
export default class Server {
  #app;
  #port;
  #pool;
  #httpServer;

  constructor(expressApp = app, port = env.port, dbPool = pool) {
    this.#app = expressApp;
    this.#port = port;
    this.#pool = dbPool;
    this.#httpServer = null;
  }

  async start() {
    try {
      await this.#pool.query('SELECT 1');
      console.log('Conexion a MySQL establecida');

      this.#httpServer = this.#app.listen(this.#port, () => {
        console.log(`Servidor corriendo en http://localhost:${this.#port}`);
      });

      process.on('SIGINT', this.shutdown);
      process.on('SIGTERM', this.shutdown);
    } catch (error) {
      console.log('No se pudo iniciar la aplicacion', error.message);
      process.exit(1);
    }
  }

  shutdown = () => {
    if (this.#httpServer) {
      this.#httpServer.close(async () => {
        await this.#pool.end();
        process.exit(0);
      });
    }
  };
}

const server = new Server();
server.start();
