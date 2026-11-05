import { matchedData } from 'express-validator';
import BookCreateDto from '../dtos/books/book.create.dto.js';
import BookUpdateDto from '../dtos/books/book.update.dto.js';

export default class BookController {
  #bookService;

  constructor(bookService) {
    this.#bookService = bookService;
  }

  getAll = async (req, res) => {
    const { page = 1, limit = 10 } = matchedData(req, { locations: ['query'] });
    const result = await this.#bookService.getAll({ page, limit });
    res.status(200).json({ status: 'success', ...result });
  };

  getById = async (req, res) => {
    const { id } = matchedData(req, { locations: ['params'] });
    const data = await this.#bookService.getById(id);
    res.status(200).json({ status: 'success', data });
  };

  create = async (req, res) => {
    const dto = new BookCreateDto(matchedData(req, { locations: ['body'] }));
    const data = await this.#bookService.create(dto);
    res.status(201).json({ status: 'success', data });
  };

  update = async (req, res) => {
    const { id } = matchedData(req, { locations: ['params'] });
    const dto = new BookUpdateDto(matchedData(req, { locations: ['body'] }));
    const data = await this.#bookService.update(id, dto);
    res.status(200).json({ status: 'success', data });
  };

  delete = async (req, res) => {
    const { id } = matchedData(req, { locations: ['params'] });
    await this.#bookService.delete(id);
    res.status(204).send();
  };
}