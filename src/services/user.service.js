import UserResponseDto from '../dtos/users/user.response.dto.js';
import { ROLES } from '../constants/roles.constants.js';
import { BadRequestError, ConflictError, NotFoundError } from '../errors/http.errors.js';

// Gestiona la lógica de negocio de usuarios y creación de clientes (standalone o inline en UoW).
export default class UserService {
  #userRepository;
  #roleRepository;
  #passwordHasher;

  constructor(userRepository, roleRepository, passwordHasher) {
    this.#userRepository = userRepository;
    this.#roleRepository = roleRepository;
    this.#passwordHasher = passwordHasher;
  }

  async getAll({ page, limit }) {
    const offset = (page - 1) * limit;
    const [rows, total] = await Promise.all([
      this.#userRepository.findAll({ limit, offset }),
      this.#userRepository.count(),
    ]);

    return {
      data: rows.map((row) => new UserResponseDto(row)),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getById(id, executor) {
    const row = await this.#userRepository.findById(id, executor);
    if (!row) {
      throw new NotFoundError('Usuario no encontrado');
    }
    return new UserResponseDto(row);
  }

  // Crea un nuevo usuario con rol Client y contraseña aleatoria devuelta una única vez en UserResponseDto.
  async create(createDto, executor) {
    const clientRole = await this.#roleRepository.findByName(ROLES.CLIENT, executor);
    if (!clientRole) {
      throw new BadRequestError('El rol de cliente no esta configurado en el sistema');
    }

    if (await this.#userRepository.findByEmail(createDto.email, executor)) {
      throw new ConflictError('El correo ya esta registrado');
    }

    if (await this.#userRepository.findByIdCard(createDto.idCard, executor)) {
      throw new ConflictError('La identificacion ya esta registrada');
    }

    const temporaryPassword = this.#passwordHasher.generateRandomPassword();
    const hashedPassword = await this.#passwordHasher.hash(temporaryPassword);

    const newId = await this.#userRepository.create(
      {
        idCard: createDto.idCard,
        fullName: createDto.fullName,
        phone: createDto.phone,
        address: createDto.address,
        email: createDto.email,
        password: hashedPassword,
        roleId: clientRole.role_id,
      },
      executor
    );

    const row = await this.#userRepository.findById(newId, executor);
    return new UserResponseDto(row, temporaryPassword);
  }

  // Verifica que el clientId exista y tenga rol Client dentro de una operación de préstamo o compra.
  async assertClientExists(clientId, executor) {
    const row = await this.#userRepository.findById(clientId, executor);
    if (!row) {
      throw new NotFoundError('Cliente no encontrado');
    }
    if (row.role_name !== ROLES.CLIENT) {
      throw new BadRequestError('El usuario indicado no tiene el rol de cliente');
    }
    return new UserResponseDto(row);
  }

  async update(id, updateDto) {
    await this.getById(id);

    if (updateDto.email) {
      const existing = await this.#userRepository.findByEmail(updateDto.email);
      if (existing && Number(existing.user_id) !== Number(id)) {
        throw new ConflictError('El correo ya esta en uso por otro usuario');
      }
    }

    await this.#userRepository.update(id, updateDto.toObject());
    return this.getById(id);
  }

  async delete(id) {
    await this.getById(id);
    await this.#userRepository.delete(id);
  }
}
