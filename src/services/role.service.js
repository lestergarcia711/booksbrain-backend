export default class RoleService {
    #roleRepository;

    constructor(roleRepository) {
        this.#roleRepository = roleRepository;
    }

    async getAll() {
        return this.#roleRepository.findAll();
    }
}