import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../errors/http.errors.js';

// Gestiona la emisión y verificación de tokens JWT y las opciones de su cookie httpOnly.
export default class TokenService {
  #secret;
  #expiresIn;
  #cookieName;
  #isProduction;

  constructor({ secret, expiresIn, cookieName, isProduction = false }) {
    this.#secret = secret;
    this.#expiresIn = expiresIn;
    this.#cookieName = cookieName;
    this.#isProduction = isProduction;
  }

  get cookieName() {
    return this.#cookieName;
  }

  get secret() {
    return this.#secret;
  }

  sign({ sub, role }) {
    return jwt.sign({ sub, role }, this.#secret, {
      algorithm: 'HS256',
      expiresIn: this.#expiresIn,
    });
  }

  verify(token) {
    try {
      return jwt.verify(token, this.#secret, { algorithms: ['HS256'] });
    } catch {
      throw new UnauthorizedError('Token invalido o expirado');
    }
  }

  getCookieOptions() {
    return {
      httpOnly: true,
      secure: this.#isProduction,
      sameSite: 'lax',
      path: '/',
    };
  }
}
