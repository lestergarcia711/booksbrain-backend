import { matchedData } from 'express-validator';
import PurchaseCreateDto from '../dtos/purchases/purchase.create.dto.js';

// Controla las peticiones administrativas de ventas presenciales (/api/v1/purchases).
export default class PurchaseController {
  #purchaseService;

  constructor(purchaseService) {
    this.#purchaseService = purchaseService;
  }

  getAll = async (req, res) => {
    const { page = 1, limit = 10 } = matchedData(req, { locations: ['query'] });
    const result = await this.#purchaseService.getAll({ page, limit });
    res.status(200).json({ status: 'success', ...result });
  };

  getById = async (req, res) => {
    const { id } = matchedData(req, { locations: ['params'] });
    const data = await this.#purchaseService.getById(id);
    res.status(200).json({ status: 'success', data });
  };

  create = async (req, res) => {
    const dto = new PurchaseCreateDto(matchedData(req, { locations: ['body'] }));
    // El admin_id proviene estrictamente del token JWT autenticado, nunca del body.
    const data = await this.#purchaseService.create(req.user.id, dto);
    const serialized = data.toJSON();
    if (serialized.temporaryPassword !== undefined) {
      res.set('Cache-Control', 'no-store');
    }
    res.status(201).json({ status: 'success', data });
  };
}
