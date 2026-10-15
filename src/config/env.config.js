import 'dotenv/config';

 const getRequired = (key) =>{
    const value = process.env[key];
    if (!value) throw new Error(`Falta la variable de entorno: ${key}`);
    return value;
 };

 export const env = Object.freeze({
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port : Number(process.env.PORT ?? 3000),
    db: {
        host : getRequired('DB_HOST'),
        port : Number(process.env.DB_PORT ?? 3306),
        user : getRequired('DB_USER'),
        password: process.env.DB_PASSWORD ?? '',
        database : getRequired('DB_NAME'),
    },
    security : {
        saltRounds: Number(process.env.BCRYPT_SALT_ROUNDS ?? 10),
    },

 });


