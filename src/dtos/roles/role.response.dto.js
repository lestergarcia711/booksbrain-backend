// Encapsula los datos de respuesta de un rol del sistema.
export default class RoleResponseDto {
  #id;
  #name;

  constructor({ role_id, role_name }) {
    this.#id = role_id;
    this.#name = role_name;
  }

  toJSON() {
    return {
      id: this.#id,
      name: this.#name,
    };
  }
}
