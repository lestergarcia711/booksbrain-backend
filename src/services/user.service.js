import UserResponseDto from '../dtos/users/user.response.dto.js';
import { BadRequestError, ConflictError, NotFoundError } from '../errors/http.errors.js';

export default class UserService {
    #userRepository;
    #roleRepository;
    #passwordHasher;


    constructor(userRepository, roleRepository, passwordHasher){
        this.#userRepository = userRepository;
        this.#roleRepository = roleRepository;
        this.#passwordHasher = passwordHasher;
    }

    async getAll({ page, limit}){
        const offset = (page -1) * limit;
        const [ rows, total] = await Promise.all([
            this.#userRepository.findAll({ limit, offset}),
            this.#userRepository.count(),
        ]);
        
        return{
            data: rows.map((row) => new UserResponseDto(row)),
            meta: { page, limit, total, totalPages: Math.ceil(total/limit)},

        };
    }

    async getById(id){
        const row = await this.#userRepository.findById(id);
        if(!row) throw new NotFoundError('Usuario no encontrado');
        return new UserResponseDto(row);
    }

    async create(createDto){
        if(!(await this.#roleRepository.findById(createDto.roleId))){
            throw new BadRequestError('El rol indicado no existe');

        }
        if(await this.#userRepository.findByEmail(createDto.email)){
            throw new ConflictError('El correo ya esta registrado');

        }

        if ( await this.#userRepository.findByIdCard(createDto.idCard)){
            throw new ConflictError('La identificacion ya esta registrada');

        }

        // hashear contrasena: regla de negocio, no sql ni http

        const hashedPassword = await this.#passwordHasher.hash(createDto.password);

        const newId = await this.#userRepository.create({
            idCard  : createDto.idCard,
            fullName: createDto.fullName,
            phone: createDto.phone,
            address: createDto.address,
            email: createDto.email,
            password: hashedPassword,
            roleId: createDto.roleId,
        });
        return this.getById(newId);
    }

    async update(id, updateDto){
        await this.getById(id);

        if(updateDto.email){
            const existing = await this.#userRepository.findByEmail(updateDto.email);
            if(existing && existing.user_id !== id){
                throw new ConflictError('El correo ya esta en uso por otro usuario');
            }
        }
        await this.#userRepository.update(id, updateDto.toObject());
        return this.getById(id);
    }

    async delete(id){
        await this.getById(id);

        await this.#userRepository.delete(id);
    }


}