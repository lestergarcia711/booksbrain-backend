import { matchedData } from 'express-validator';
import PasswordUpdateDto from '../dtos/auth/password.update.dto.js';

// Controla las peticiones HTTP de autenticación (/auth/login, /auth/logout, /auth/me, /auth/password).
export default class AuthController {
  #authService;

  constructor(authService) {
    this.#authService = authService;
  }

  login = async (req, res) => {
    const { token, cookieName, cookieOptions, user } = this.#authService.createSession(req.user);
    res.cookie(cookieName, token, cookieOptions);
    res.status(200).json({ status: 'success', data: user });
  };

  logout = async (req, res) => {
    const { cookieName, cookieOptions } = this.#authService.getLogoutCookieConfig();
    res.clearCookie(cookieName, cookieOptions);
    res.status(200).json({ status: 'success', message: 'Sesion cerrada correctamente' });
  };

  me = async (req, res) => {
    const data = await this.#authService.getProfile(req.user.id);
    res.status(200).json({ status: 'success', data });
  };

  updatePassword = async (req, res) => {
    const dto = new PasswordUpdateDto(matchedData(req, { locations: ['body'] }));
    await this.#authService.updatePassword(req.user.id, dto);
    res.status(200).json({ status: 'success', message: 'Contrasenia actualizada correctamente' });
  };
}
