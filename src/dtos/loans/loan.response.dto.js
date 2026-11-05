// Encapsula los datos de salida de un préstamo derivando dinámicamente el estado 'Overdue'.
export default class LoanResponseDto {
  #id;
  #loanDate;
  #expectedReturnDate;
  #actualReturnDate;
  #status;
  #client;
  #adminId;
  #items;
  #temporaryPassword;

  constructor(row, temporaryPassword = undefined) {
    this.#id = row.loan_id;
    this.#loanDate = row.loan_date;
    this.#expectedReturnDate = row.expected_return_date;
    this.#actualReturnDate = row.actual_return_date ?? null;
    this.#status = this.#resolveStatus(row);
    this.#client = {
      id: row.client_id,
      ...(row.client_name !== undefined && { fullName: row.client_name }),
      ...(row.client_email !== undefined && { email: row.client_email }),
    };
    this.#adminId = row.admin_id;
    this.#items = (row.details ?? []).map((detail) => ({
      id: detail.loan_detail_id,
      copyId: detail.copy_id,
      barcode: detail.barcode,
      bookId: detail.book_id,
      bookTitle: detail.book_title,
      checkoutCondition: detail.checkout_condition,
      checkinCondition: detail.checkin_condition ?? null,
    }));
    this.#temporaryPassword = temporaryPassword;
  }

  #resolveStatus(row) {
    if (row.effective_status) {
      return row.effective_status;
    }
    if (row.status === 'Active' && row.expected_return_date) {
      const today = new Date().toISOString().slice(0, 10);
      if (String(row.expected_return_date).slice(0, 10) < today) {
        return 'Overdue';
      }
    }
    return row.status;
  }

  toJSON() {
    return {
      id: this.#id,
      loanDate: this.#loanDate,
      expectedReturnDate: this.#expectedReturnDate,
      actualReturnDate: this.#actualReturnDate,
      status: this.#status,
      client: this.#client,
      adminId: this.#adminId,
      items: this.#items,
      ...(this.#temporaryPassword !== undefined && {
        temporaryPassword: this.#temporaryPassword,
      }),
    };
  }
}
