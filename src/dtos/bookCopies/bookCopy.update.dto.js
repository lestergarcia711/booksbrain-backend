// Encapsula los campos actualizables de un ejemplar físico.
export default class BookCopyUpdateDto {
  #barcode;
  #physicalCondition;
  #status;

  constructor({ barcode, physicalCondition, status }) {
    this.#barcode = barcode;
    this.#physicalCondition = physicalCondition;
    this.#status = status;
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

  toObject() {
    const fields = {
      barcode: this.#barcode,
      physicalCondition: this.#physicalCondition,
      status: this.#status,
    };
    return Object.fromEntries(
      Object.entries(fields).filter(([, value]) => value !== undefined)
    );
  }
}
