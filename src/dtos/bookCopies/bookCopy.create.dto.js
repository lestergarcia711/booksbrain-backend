// Encapsula los datos de entrada para registrar un ejemplar físico de un libro.
export default class BookCopyCreateDto {
  #bookId;
  #barcode;
  #physicalCondition;
  #status;

  constructor({ bookId, barcode, physicalCondition, status }) {
    this.#bookId = Number(bookId);
    this.#barcode = barcode;
    this.#physicalCondition = physicalCondition ?? 'Good';
    this.#status = status ?? 'Available';
  }

  get bookId() {
    return this.#bookId;
  }

  get barcode() {
    return this.#barcode;
  }

  get physicalCondition() {
    return this.#physicalCondition;
  }

  get status() {
    return this.#status;
  }
}
