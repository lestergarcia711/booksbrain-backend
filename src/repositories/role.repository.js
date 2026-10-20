export default class RoleRepository {
    #pool;

    constructor(pool){
        this.#pool = pool;

    }

    async findAll(){
        const [rows]= await this.#pool.query(
            `SELECT role_id, role_name FROM roles ORDER BY role_name`

        );

        return rows;
    }

    // Busca un rol por su identificador para validar usuarios nuevos.
    async findById(id){
        const [rows] = await this.#pool.execute(
            'SELECT role_id, role_name FROM roles WHERE role_id = ?',
            [id]
        );
        return rows[0] ?? null;
    }
}