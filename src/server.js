import app from './app.js';
import { env } from './config/env.config.js';
import { pool } from './config/database.config.js';

const start = async()=>{
    try{
        await pool.query('SELECT 1');
        console.log('Conexion a MySQL establecida');

        const server = app.listen(env.port, ()=>{
            console.log(`Servidor corriendo en https://localhost:${env.port}`);

        });

        const shutdown = ()=>{
            server.close(async ()=>{
                await pool.end();
                process.exit(0);
          });
        };

        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);

    }catch(error){
        console.log('No se pudo iniciar la aplicacion', error.message);
        process.exit(1);
    }
};

start();