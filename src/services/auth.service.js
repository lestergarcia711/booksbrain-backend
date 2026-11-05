import UserResponseDto from '../dtos/users/user.response.dto.js';
import { UnauthorizedError } from '../errors/http.errors.js';

// Coordina la lógica de autenticación, emisión de sesión JWT, consulta de perfil y cambio de contraseña.
export default class AuthService {
  #userRepository;
  #passwordHasher;
  #tokenService;

  constructor(userRepository, passwordHasher, tokenService) {
    this.#userRepository = userRepository;
    this.#passwordHasher = passwordHasher;
    this.#tokenService = tokenService;
  }

  // Verifica credenciales con mensaje genérico e igualación de tiempo si el email no existe.
  async verifyCredentials(email, plainPassword) {
    const userRow = await this.#userRepository.findByEmailWithPassword(email);

    if (!userRow) {
      await this.#passwordHasher.compareWithDummy(plainPassword);
      throw new UnauthorizedError('Credenciales invalidas');
    }

    const isPasswordValid = await this.#passwordHasher.compare(plainPassword, userRow.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Credenciales invalidas');
    }

    return new UserResponseDto(userRow);
  }

  // Genera el token JWT con claims mínimos (sub y role) y retorna la configuración de la cookie.
  createSession(userDto) {
    const serialized = userDto.toJSON();
    const token = this.#tokenService.sign({
      sub: serialized.id,
      role: serialized.role.name,
    });

    return {
      token,
      cookieName: this.#tokenService.cookieName,
      cookieOptions: this.#tokenService.getCookieOptions(),
      user: userDto,
    };
  }

  getLogoutCookieConfig() {
    return {
      cookieName: this.#tokenService.cookieName,
      cookieOptions: this.#tokenService.getCookieOptions(),
    };
  }

  async getProfile(userId) {
    const row = await this.#userRepository.findById(userId);
    if (!row) {
      throw new UnauthorizedError('Usuario no valido');
    }
    return new UserResponseDto(row);
  }

  async updatePassword(userId, passwordUpdateDto) {
    const userRow = await this.#userRepository.findByIdWithPassword(userId);
    if (!userRow) {
      throw new UnauthorizedError('Usuario no valido');
    }

    const isCurrentValid = await this.#passwordHasher.compare(
      passwordUpdateDto.currentPassword,
      userRow.password
    );
    if (!isCurrentValid) {
      throw new UnauthorizedError('La contrasenia actual es incorrecta');
    }

    const hashedPassword = await this.#passwordHasher.hash(passwordUpdateDto.newPassword);
    await this.#userRepository.updatePassword(userId, hashedPassword);
  }
}
