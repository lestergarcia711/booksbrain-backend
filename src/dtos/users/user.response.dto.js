// Encapsula los datos de respuesta de un usuario (incluyendo temporaryPassword una única vez al crearse).
export default class UserResponseDto {
  #id;
  #idCard;
  #fullName;
  #phone;
  #address;
  #email;
  #roleId;
  #roleName;
  #temporaryPassword;

  constructor(row, temporaryPassword = undefined) {
    this.#id = row.user_id;
    this.#idCard = row.id_card;
    this.#fullName = row.full_name;
    this.#phone = row.phone;
    this.#address = row.address;
    this.#email = row.email;
    this.#roleId = row.role_id;
    this.#roleName = row.role_name;
    this.#temporaryPassword = temporaryPassword;
  }

  get id() {
    return this.#id;
  }

  get roleName() {
    return this.#roleName;
  }

  toJSON() {
    return {
      id: this.#id,
      idCard: this.#idCard,
      fullName: this.#fullName,
      phone: this.#phone,
      address: this.#address,
      email: this.#email,
      role: { id: this.#roleId, name: this.#roleName },
      ...(this.#temporaryPassword !== undefined && {
        temporaryPassword: this.#temporaryPassword,
      }),
    };
  }
}
