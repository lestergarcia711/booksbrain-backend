export default class BookUpdateDto {
  #title;
  #isbn;
  #salePrice;
  #categoryId;
  #authorIds;

  constructor({ title, isbn, salePrice, categoryId, authorIds }) {
    this.#title = title;
    this.#isbn = isbn;
    this.#salePrice = salePrice;
    this.#categoryId = categoryId;
    this.#authorIds = authorIds === undefined
      ? undefined
      : [...new Set(authorIds.map(Number))];
  }

  get title() { return this.#title; }
  get isbn() { return this.#isbn; }
  get salePrice() { return this.#salePrice; }
  get categoryId() { return this.#categoryId; }
  get authorIds() { return this.#authorIds; } // undefined = "no tocar los autores"

  // Solo los campos de la tabla `books` que llegaron.
  // authorIds va aparte porque se guarda en OTRA tabla (book_authors).
  toObject() {
    const fields = {
      title: this.#title,
      isbn: this.#isbn,
      salePrice: this.#salePrice,
      categoryId: this.#categoryId,
    };
    return Object.fromEntries(
      Object.entries(fields).filter(([, value]) => value !== undefined)
    );
  }
}