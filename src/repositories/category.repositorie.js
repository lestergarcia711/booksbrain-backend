export default class CategoryRepository {
    #pool;

    constructor(pool){
        this.#pool = pool;

    }

    async findAll(){
        const [rows]= await this.#pool.query(
            `SELECT category_id, category_name FROM categories ORDER BY category_name`

        );

        return rows;
    }

    async findById(id){
        const [rows]= await this.#pool.execute(
            'SELECT category_id, category_name FROM categories WHERE category_id = ?',
            [id]
        );
        return rows[0] ?? null;

    }
     async findByName(name){
        const [rows]= await this.#pool.execute(
            'SELECT category_id, category_name FROM categories WHERE category_name = ?',
            [name]
        );
        return rows[0] ?? null;
    }

    async create(name){
        const [result] = await this.#pool.execute(
            'INSERT INTO categories (category_name) VALUES(?)',
            [name]
        );
        return result.insertId;
    }

    async update(id, name){
        const [result] = await this.#pool.execute(
            'UPDATE categories SET  category_name = ? WHERE category_id = ?',
            [name, id]
        );
        return result.insertId;
    }

    async delete(id){
        const [result] = await this.#pool.execute(
            'DELETE FROM categories WHERE  category_id = ?',
        [id]
        );
        return result.insertId;
    }
    

}