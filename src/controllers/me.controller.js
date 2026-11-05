import { matchedData } from 'express-validator';

// Controla las consultas personales del cliente autenticado (/api/v1/me/loans y /api/v1/me/purchases).
export default class MeController {
  #loanService;
  #purchaseService;

  constructor(loanService, purchaseService) {
    this.#loanService = loanService;
    this.#purchaseService = purchaseService;
  }

  getMyLoans = async (req, res) => {
    const { status, page = 1, limit = 10 } = matchedData(req, {
      locations: ['query'],
    });
    const result = await this.#loanService.getClientLoans(req.user.id, {
      status,
      page,
      limit,
    });
    res.status(200).json({ status: 'success', ...result });
  };

  getMyLoanById = async (req, res) => {
    const { id } = matchedData(req, { locations: ['params'] });
    const data = await this.#loanService.getClientLoanById(req.user.id, id);
    res.status(200).json({ status: 'success', data });
  };

  getMyPurchases = async (req, res) => {
    const { page = 1, limit = 10 } = matchedData(req, { locations: ['query'] });
    const result = await this.#purchaseService.getClientPurchases(req.user.id, {
      page,
      limit,
    });
    res.status(200).json({ status: 'success', ...result });
  };

  getMyPurchaseById = async (req, res) => {
    const { id } = matchedData(req, { locations: ['params'] });
    const data = await this.#purchaseService.getClientPurchaseById(req.user.id, id);
    res.status(200).json({ status: 'success', data });
  };
}
