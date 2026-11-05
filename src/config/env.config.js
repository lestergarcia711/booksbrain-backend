import 'dotenv/config';

// Gestiona y valida todas las variables de entorno de la aplicación mediante programación orientada a objetos.
export default class EnvConfig {
  #nodeEnv;
  #port;
  #db;
  #security;
  #jwt;
  #rateLimit;
  #loans;

  constructor(processEnv = process.env) {
    this.#nodeEnv = processEnv.NODE_ENV ?? 'development';
    this.#port = this.#getPositiveInt(processEnv, 'PORT', 3000);

    this.#db = Object.freeze({
      host: this.#getRequired(processEnv, 'DB_HOST'),
      port: this.#getPositiveInt(processEnv, 'DB_PORT', 3306),
      user: this.#getRequired(processEnv, 'DB_USER'),
      password: processEnv.DB_PASSWORD ?? '',
      database: this.#getRequired(processEnv, 'DB_NAME'),
    });

    const fallbackRounds = this.#getPositiveInt(processEnv, 'BCRYPT_ROUNDS', 10);
    this.#security = Object.freeze({
      saltRounds: this.#getPositiveInt(processEnv, 'BCRYPT_SALT_ROUNDS', fallbackRounds),
      corsOrigins: this.#getCorsOrigins(processEnv),
    });

    this.#jwt = Object.freeze({
      secret: this.#getJwtSecret(processEnv),
      expiresIn: processEnv.JWT_EXPIRES_IN ?? '15m',
      cookieName: processEnv.JWT_COOKIE_NAME ?? 'access_token',
    });

    this.#rateLimit = Object.freeze({
      globalWindowMs: this.#getPositiveInt(processEnv, 'RATE_LIMIT_GLOBAL_WINDOW_MS', 15 * 60 * 1000),
      globalMax: this.#getPositiveInt(processEnv, 'RATE_LIMIT_GLOBAL_MAX', 100),
      loginWindowMs: this.#getPositiveInt(processEnv, 'RATE_LIMIT_LOGIN_WINDOW_MS', 15 * 60 * 1000),
      loginMax: this.#getPositiveInt(processEnv, 'RATE_LIMIT_LOGIN_MAX', 5),
      catalogWindowMs: this.#getPositiveInt(processEnv, 'RATE_LIMIT_CATALOG_WINDOW_MS', 60 * 1000),
      catalogMax: this.#getPositiveInt(processEnv, 'RATE_LIMIT_CATALOG_MAX', 60),
    });

    this.#loans = Object.freeze({
      defaultDays: this.#getPositiveInt(processEnv, 'LOAN_DEFAULT_DAYS', 14),
      maxActiveCopies: this.#getPositiveInt(processEnv, 'LOAN_MAX_ACTIVE_COPIES', 5),
    });
  }

  get nodeEnv() {
    return this.#nodeEnv;
  }

  get port() {
    return this.#port;
  }

  get db() {
    return this.#db;
  }

  get security() {
    return this.#security;
  }

  get jwt() {
    return this.#jwt;
  }

  get rateLimit() {
    return this.#rateLimit;
  }

  get loans() {
    return this.#loans;
  }

  #getRequired(processEnv, key) {
    const value = processEnv[key];
    if (!value || value.trim() === '') {
      throw new Error(`Falta la variable de entorno obligatoria: ${key}`);
    }
    return value.trim();
  }

  #getPositiveInt(processEnv, key, defaultValue) {
    const raw = processEnv[key];
    const value = raw !== undefined && raw !== '' ? Number(raw) : defaultValue;
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error(`La variable de entorno ${key} debe ser un entero positivo`);
    }
    return value;
  }

  #getJwtSecret(processEnv) {
    const secret = this.#getRequired(processEnv, 'JWT_SECRET');
    if (secret.length < 32) {
      throw new Error('La variable JWT_SECRET debe tener al menos 32 caracteres');
    }
    return secret;
  }

  #getCorsOrigins(processEnv) {
    const raw = processEnv.CORS_ORIGINS ?? 'http://localhost:3000';
    const origins = raw
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);

    if (origins.length === 0) {
      throw new Error('CORS_ORIGINS debe contener al menos un origen valido');
    }
    return Object.freeze(origins);
  }
}

export const env = new EnvConfig();
