// Encapsula la representación de salida de una compra con sus detalles y cliente.
export default class PurchaseResponseDto {
  #id;
  #purchaseDate;
  #totalAmount;
  #client;
  #adminId;
  #items;
  #temporaryPassword;

  constructor(row, temporaryPassword = undefined) {
    this.#id = row.purchase_id;
    this.#purchaseDate = row.purchase_date;
    this.#totalAmount = Number(row.total_amount);
    this.#client = {
      id: row.client_id,
      ...(row.client_name !== undefined && { fullName: row.client_name }),
      ...(row.client_email !== undefined && { email: row.client_email }),
    };
    this.#adminId = row.admin_id;
    this.#items = (row.details ?? []).map((detail) => ({
      id: detail.purchase_detail_id,
      bookId: detail.book_id,
      bookTitle: detail.book_title,
      quantity: detail.quantity,
      unitPrice: Number(detail.unit_price),
      subtotal: Number((Math.round(Number(detail.unit_price) * 100) * detail.quantity / 100).toFixed(2)),
    }));
    this.#temporaryPassword = temporaryPassword;
  }

  toJSON() {
    return {
      id: this.#id,
      purchaseDate: this.#purchaseDate,
      totalAmount: this.#totalAmount,
      client: this.#client,
      adminId: this.#adminId,
      items: this.#items,
      ...(this.#temporaryPassword !== undefined && {
        temporaryPassword: this.#temporaryPassword,
      }),
    };
  }
}
