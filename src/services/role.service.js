import RoleResponseDto from '../dtos/roles/role.response.dto.js';

// Coordina la consulta de roles devolviendo instancias de RoleResponseDto.
export default class RoleService {
  #roleRepository;

  constructor(roleRepository) {
    this.#roleRepository = roleRepository;
  }

  async getAll() {
    const rows = await this.#roleRepository.findAll();
    return rows.map((row) => new RoleResponseDto(row));
  }
}
