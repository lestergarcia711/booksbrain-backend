import CategoryResponseDto from '../categories/category.response.dto.js';

// Representa un libro en el catálogo público ocultando barcodes, stock mínimo e IDs de copias.
export default class CatalogBookResponseDto {
  #id;
  #title;
  #salePrice;
  #category;
  #authors;
  #available;

  constructor(row) {
    this.#id = row.book_id;
    this.#title = row.title;
    this.#salePrice = Number(row.sale_price);
    this.#category = new CategoryResponseDto(row);
    this.#authors = (row.authors ?? []).map((author) => ({
      id: author.author_id,
      fullName: author.full_name,
    }));
    this.#available = Number(row.available_stock ?? 0) > 0;
  }

  toJSON() {
    return {
      id: this.#id,
      title: this.#title,
      salePrice: this.#salePrice,
      category: this.#category,
      authors: this.#authors,
      available: this.#available,
    };
  }
}
