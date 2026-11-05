// Encapsula la representación de salida de un ejemplar físico (uso administrativo).
export default class BookCopyResponseDto {
  #id;
  #barcode;
  #physicalCondition;
  #status;
  #bookId;
  #bookTitle;

  constructor(row) {
    this.#id = row.copy_id;
    this.#barcode = row.barcode;
    this.#physicalCondition = row.physical_condition;
    this.#status = row.status;
    this.#bookId = row.book_id;
    this.#bookTitle = row.book_title ?? undefined;
  }

  toJSON() {
    return {
      id: this.#id,
      barcode: this.#barcode,
      physicalCondition: this.#physicalCondition,
      status: this.#status,
      bookId: this.#bookId,
      ...(this.#bookTitle !== undefined && { bookTitle: this.#bookTitle }),
    };
  }
}
