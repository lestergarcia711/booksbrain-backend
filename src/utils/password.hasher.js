import crypto from 'node:crypto';
import bcrypt from 'bcrypt';

// Encapsula el hash, verificación y generación criptográfica de contraseñas con bcrypt y crypto.
export default class PasswordHasher {
  #saltRounds;
  #dummyHash;

  constructor(saltRounds) {
    this.#saltRounds = saltRounds;
    // Hash falso precalculado para igualar tiempos de respuesta cuando el email no existe en login.
    this.#dummyHash = bcrypt.hashSync('dummy_secret_password_timing_guard_123', this.#saltRounds);
  }

  hash(plainPassword) {
    return bcrypt.hash(plainPassword, this.#saltRounds);
  }

  compare(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  compareWithDummy(plainPassword) {
    return bcrypt.compare(plainPassword, this.#dummyHash);
  }

  generateRandomPassword(length = 12) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    const randomBytes = crypto.randomBytes(length);
    let result = '';
    for (let i = 0; i < length; i += 1) {
      result += chars[randomBytes[i] % chars.length];
    }
    return `${result}A1a`;
  }
}
