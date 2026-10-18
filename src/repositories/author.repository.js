export default class AuthorRepository {
    #pool;

    constructor(pool){
        this.#pool = pool;

    }

    async findAll(){
        const [rows]= await this.#pool.query(
            `SELECT author_id, full_name FROM authors ORDER BY full_name`

        );

        return rows;
    }

    async findById(id){
        const [rows]= await this.#pool.execute(
            'SELECT author_id, full_name FROM authors WHERE author_id = ?',
            [id]
        );
        return rows[0] ?? null;

    }
     async findByName(name){
        const [rows]= await this.#pool.execute(
            'SELECT author_id, full_name FROM authors WHERE full_name = ?',
            [name]
        );
        return rows[0] ?? null;
    }

    async create(name){
        const [result] = await this.#pool.execute(
            'INSERT INTO authors (full_name) VALUES(?)',
            [name]
        );
        return result.insertId;
    }

    async update(id, fullName){
        const [result] = await this.#pool.execute(
            'UPDATE authors  SET full_name = ? WHERE author_id = ?',
            [fullName, id]
        );
        return result.affectedRows;
    }

    async delete(id){
        const [result] = await this.#pool.execute(
            'DELETE FROM authors WHERE  author_id = ?',
        [id]
        );
        return result.affectedRows;
    }
    

}