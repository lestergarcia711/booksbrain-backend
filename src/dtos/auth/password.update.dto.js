// Encapsula la contraseña actual y la nueva para el cambio de clave del usuario autenticado.
export default class PasswordUpdateDto {
  #currentPassword;
  #newPassword;

  constructor({ currentPassword, newPassword }) {
    this.#currentPassword = currentPassword;
    this.#newPassword = newPassword;
  }

  get currentPassword() {
    return this.#currentPassword;
  }

  get newPassword() {
    return this.#newPassword;
  }
}
