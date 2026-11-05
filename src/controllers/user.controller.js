import { matchedData } from 'express-validator';
import UserCreateDto from '../dtos/users/user.create.dto.js';
import UserUpdateDto from '../dtos/users/user.update.dto.js';

export default class UserController {
  #userService;

  constructor(userService) {
    this.#userService = userService;
  }

  getAll = async (req, res) => {
    const { page = 1, limit = 10 } = matchedData(req, { locations: ['query'] });
    const result = await this.#userService.getAll({ page, limit });
    res.status(200).json({ status: 'success', ...result });
  };

  getById = async (req, res) => {
    const { id } = matchedData(req, { locations: ['params'] });
    const data = await this.#userService.getById(id);
    res.status(200).json({ status: 'success', data });
  };

  create = async (req, res) => {
    const dto = new UserCreateDto(matchedData(req, { locations: ['body'] }));
    const data = await this.#userService.create(dto);
    res.set('Cache-Control', 'no-store');
    res.status(201).json({ status: 'success', data });
  };

  update = async (req, res) => {
    const { id } = matchedData(req, { locations: ['params'] });
    const dto = new UserUpdateDto(matchedData(req, { locations: ['body'] }));
    const data = await this.#userService.update(id, dto);
    res.status(200).json({ status: 'success', data });
  };

  delete = async (req, res) => {
    const { id } = matchedData(req, { locations: ['params'] });
    await this.#userService.delete(id);
    res.status(204).send();
  };
}