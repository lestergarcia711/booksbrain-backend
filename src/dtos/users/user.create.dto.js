// Encapsula los datos de entrada para crear un nuevo cliente (el rol y la clave se asignan en el servidor).
export default class UserCreateDto {
  #idCard;
  #fullName;
  #phone;
  #address;
  #email;

  constructor({ idCard, fullName, phone, address, email }) {
    this.#idCard = idCard;
    this.#fullName = fullName;
    this.#phone = phone ?? null;
    this.#address = address ?? null;
    this.#email = email;
  }

  get idCard() {
    return this.#idCard;
  }

  get fullName() {
    return this.#fullName;
  }

  get phone() {
    return this.#phone;
  }

  get address() {
    return this.#address;
  }

  get email() {
    return this.#email;
  }
}
