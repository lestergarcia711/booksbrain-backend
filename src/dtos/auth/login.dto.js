// Encapsula las credenciales de inicio de sesión validadas.
export default class LoginDto {
  #email;
  #password;

  constructor({ email, password }) {
    this.#email = email;
    this.#password = password;
  }

  get email() {
    return this.#email;
  }

  get password() {
    return this.#password;
  }
}
