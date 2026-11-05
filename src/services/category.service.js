import CategoryResponseDto from '../dtos/categories/category.response.dto.js';
import { ConflictError, NotFoundError } from '../errors/http.errors.js';

// Coordina la lógica de negocio para las categorías de libros.
export default class CategoryService {
  #categoryRepository;

  constructor(categoryRepository) {
    this.#categoryRepository = categoryRepository;
  }

  async getAll() {
    const rows = await this.#categoryRepository.findAll();
    return rows.map((row) => new CategoryResponseDto(row));
  }

  async getById(id) {
    const row = await this.#categoryRepository.findById(id);
    if (!row) {
      throw new NotFoundError('Categoria no encontrada');
    }
    return new CategoryResponseDto(row);
  }

  async create(createDto) {
    if (await this.#categoryRepository.findByName(createDto.name)) {
      throw new ConflictError('Ya existe una categoria con ese nombre');
    }

    const newId = await this.#categoryRepository.create(createDto.name);
    return this.getById(newId);
  }

  async update(id, updateDto) {
    await this.getById(id);

    const existing = await this.#categoryRepository.findByName(updateDto.name);
    if (existing && Number(existing.category_id) !== Number(id)) {
      throw new ConflictError('Ya existe otra categoria con ese nombre');
    }

    await this.#categoryRepository.update(id, updateDto.name);
    return this.getById(id);
  }

  async delete(id) {
    await this.getById(id);
    await this.#categoryRepository.delete(id);
  }
}
