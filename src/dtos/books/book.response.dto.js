import CategoryResponseDto from '../categories/category.response.dto.js';

export default class BookResponseDto {
  #id;
  #title;
  #isbn;
  #salePrice;
  #category;
  #authors;
  #stock;

  // `row` es la fila del repository: columnas de books + categoría + inventario + `authors` ya armado
  constructor(row) {
    this.#id = row.book_id;
    this.#title = row.title;
    this.#isbn = row.isbn;
    this.#salePrice = Number(row.sale_price);
    this.#category = new CategoryResponseDto(row);
    this.#authors = row.authors.map((a) => ({ id: a.author_id, fullName: a.full_name }));
    this.#stock = { available: row.available_stock ?? 0, minimum: row.minimum_stock ?? 0 };
  }

  // JSON.stringify llama a toJSON() también en los DTOs anidados (la categoría), automáticamente
  toJSON() {
    return {
      id: this.#id,
      title: this.#title,
      isbn: this.#isbn,
      salePrice: this.#salePrice,
      category: this.#category,
      authors: this.#authors,
      stock: this.#stock,
    };
  }
}