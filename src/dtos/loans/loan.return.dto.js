// Encapsula la lista de ejemplares devueltos [{ copyId, checkinCondition }] en un préstamo.
export default class LoanReturnDto {
  #returns;

  constructor({ returns, items }) {
    const rawList = Array.isArray(returns) ? returns : Array.isArray(items) ? items : [];
    this.#returns = rawList.map((item) => ({
      copyId: Number(item.copyId),
      checkinCondition: item.checkinCondition,
    }));
  }

  get returns() {
    return this.#returns;
  }
}
