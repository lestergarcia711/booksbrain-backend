import { matchedData } from 'express-validator';
import BookCopyCreateDto from '../dtos/bookCopies/bookCopy.create.dto.js';
import BookCopyUpdateDto from '../dtos/bookCopies/bookCopy.update.dto.js';

// Controla las peticiones HTTP para los ejemplares físicos de libros (/api/v1/book-copies).
export default class BookCopyController {
  #bookCopyService;

  constructor(bookCopyService) {
    this.#bookCopyService = bookCopyService;
  }

  getAll = async (req, res) => {
    const { bookId, status, page = 1, limit = 10 } = matchedData(req, {
      locations: ['query'],
    });
    const result = await this.#bookCopyService.getAll({ bookId, status, page, limit });
    res.status(200).json({ status: 'success', ...result });
  };

  getById = async (req, res) => {
    const { id } = matchedData(req, { locations: ['params'] });
    const data = await this.#bookCopyService.getById(id);
    res.status(200).json({ status: 'success', data });
  };

  create = async (req, res) => {
    const dto = new BookCopyCreateDto(matchedData(req, { locations: ['body'] }));
    const data = await this.#bookCopyService.create(dto);
    res.status(201).json({ status: 'success', data });
  };

  update = async (req, res) => {
    const { id } = matchedData(req, { locations: ['params'] });
    const dto = new BookCopyUpdateDto(matchedData(req, { locations: ['body'] }));
    const data = await this.#bookCopyService.update(id, dto);
    res.status(200).json({ status: 'success', data });
  };

  delete = async (req, res) => {
    const { id } = matchedData(req, { locations: ['params'] });
    await this.#bookCopyService.delete(id);
    res.status(204).send();
  };
}
