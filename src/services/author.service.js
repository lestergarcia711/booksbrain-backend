import AuthorResponseDto from '../dtos/authors/author.response.dto.js';
import { ConflictError, NotFoundError } from '../errors/http.errors.js';

// Coordina la lógica de negocio para los autores de libros.
export default class AuthorService {
  #authorRepository;

  constructor(authorRepository) {
    this.#authorRepository = authorRepository;
  }

  async getAll() {
    const rows = await this.#authorRepository.findAll();
    return rows.map((row) => new AuthorResponseDto(row));
  }

  async getById(id) {
    const row = await this.#authorRepository.findById(id);
    if (!row) {
      throw new NotFoundError('Autor no encontrado');
    }
    return new AuthorResponseDto(row);
  }

  async create(createDto) {
    if (await this.#authorRepository.findByName(createDto.fullName)) {
      throw new ConflictError('Ya existe un autor con ese nombre');
    }

    const newId = await this.#authorRepository.create(createDto.fullName);
    return this.getById(newId);
  }

  async update(id, updateDto) {
    await this.getById(id);

    const existing = await this.#authorRepository.findByName(updateDto.fullName);
    if (existing && Number(existing.author_id) !== Number(id)) {
      throw new ConflictError('Ya existe otro autor con ese nombre');
    }

    await this.#authorRepository.update(id, updateDto.fullName);
    return this.getById(id);
  }

  async delete(id) {
    await this.getById(id);
    await this.#authorRepository.delete(id);
  }
}
