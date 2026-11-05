import UserCreateDto from '../users/user.create.dto.js';

// Encapsula los datos de entrada para registrar un préstamo presencial (con clientId XOR objeto client inline).
export default class LoanCreateDto {
  #clientId;
  #client;
  #bookIds;
  #copyIds;
  #expectedReturnDate;

  constructor({ clientId, client, bookIds, copyIds, expectedReturnDate }) {
    this.#clientId = clientId !== undefined ? Number(clientId) : undefined;
    this.#client = client?.email ? new UserCreateDto(client) : undefined;
    this.#bookIds = Array.isArray(bookIds) ? bookIds.map(Number) : undefined;
    this.#copyIds = Array.isArray(copyIds) ? [...new Set(copyIds.map(Number))] : undefined;
    this.#expectedReturnDate = expectedReturnDate ?? undefined;
  }

  get clientId() {
    return this.#clientId;
  }

  get client() {
    return this.#client;
  }

  get bookIds() {
    return this.#bookIds;
  }

  get copyIds() {
    return this.#copyIds;
  }

  get expectedReturnDate() {
    return this.#expectedReturnDate;
  }
}
