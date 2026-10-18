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
}