import { matchedData } from 'express-validator';
import LoanCreateDto from '../dtos/loans/loan.create.dto.js';
import LoanReturnDto from '../dtos/loans/loan.return.dto.js';

// Controla las peticiones administrativas de préstamos y devoluciones (/api/v1/loans).
export default class LoanController {
  #loanService;

  constructor(loanService) {
    this.#loanService = loanService;
  }

  getAll = async (req, res) => {
    const { status, page = 1, limit = 10 } = matchedData(req, {
      locations: ['query'],
    });
    const result = await this.#loanService.getAll({ status, page, limit });
    res.status(200).json({ status: 'success', ...result });
  };

  getById = async (req, res) => {
    const { id } = matchedData(req, { locations: ['params'] });
    const data = await this.#loanService.getById(id);
    res.status(200).json({ status: 'success', data });
  };

  create = async (req, res) => {
    const dto = new LoanCreateDto(matchedData(req, { locations: ['body'] }));
    // El admin_id proviene estrictamente del token JWT autenticado, nunca del body.
    const data = await this.#loanService.create(req.user.id, dto);
    const serialized = data.toJSON();
    if (serialized.temporaryPassword !== undefined) {
      res.set('Cache-Control', 'no-store');
    }
    res.status(201).json({ status: 'success', data });
  };

  returnCopies = async (req, res) => {
    const { id } = matchedData(req, { locations: ['params'] });
    const dto = new LoanReturnDto(matchedData(req, { locations: ['body'] }));
    const data = await this.#loanService.returnCopies(id, dto);
    res.status(200).json({ status: 'success', data });
  };
}
