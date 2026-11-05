import UserCreateDto from '../users/user.create.dto.js';

// Encapsula los datos de una compra consolidando libros repetidos y ordenándolos por bookId.
export default class PurchaseCreateDto {
  #clientId;
  #client;
  #items;

  constructor({ clientId, client, items }) {
    this.#clientId = clientId !== undefined ? Number(clientId) : undefined;
    this.#client = client?.email ? new UserCreateDto(client) : undefined;
    this.#items = this.#consolidateItems(items ?? []);
  }

  get clientId() {
    return this.#clientId;
  }

  get client() {
    return this.#client;
  }

  get items() {
    return this.#items;
  }

  // Suma cantidades si el mismo bookId aparece varias veces y ordena por bookId ASC para prevenir deadlocks.
  #consolidateItems(rawItems) {
    const map = new Map();
    for (const item of rawItems) {
      const bookId = Number(item.bookId);
      const quantity = Number(item.quantity);
      map.set(bookId, (map.get(bookId) ?? 0) + quantity);
    }

    return [...map.entries()]
      .sort(([bookIdA], [bookIdB]) => bookIdA - bookIdB)
      .map(([bookId, quantity]) => ({ bookId, quantity }));
  }
}
