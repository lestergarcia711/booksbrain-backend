// Consulta usuarios y agrega el nombre de su rol.
const BASE_SELECT = `
SELECT u.user_id, u.id_card, u.full_name, u.phone, u.address, u.email, u.role_id, r.role_name
FROM users u
INNER JOIN roles r ON r.role_id = u.role_id`;

// Indica qué datos del usuario se pueden cambiar y cómo se llaman en la base de datos.
const UPDATABLE_COLUMNS = {
    fullName: 'full_name',
    phone: 'phone',
    address: 'address',
    email: 'email',

};

// Reúne los métodos que consultan y modifican usuarios en la base de datos.
export default class UserRepository {
    #pool;

    // Guarda la conexión a la base de datos para usarla en los demás métodos.
    constructor(pool){
        this.#pool = pool;

    }

    // Muestra una parte de los usuarios y los ordena por su identificador.
    async findAll({ limit, offset}){
        const [rows] = await this.#pool.query(
            `${BASE_SELECT} ORDER BY u.user_id LIMIT ? OFFSET ?`,
            [limit, offset]
        );

        return rows;
    }
    // Cuenta los usuarios registrados para saber cuántos hay en total.
    async count(){
        const [[{ total }]] = await this.#pool.query('SELECT COUNT(*) AS total FROM users');
        return total;
    }

    // Busca un usuario por su identificador; falta completar la consulta y devolver el resultado.
    async findById(id){
        const [rows] = await this.#pool.execute(`${BASE_SELECT} WHERE u.user_id = ?`, [id]);
        return rows[0] ?? null;

    }

    async findByEmail(email){
        const[ rows ] = await this.#pool.execute(`${BASE_SELECT} WHERE u.email = ?`, [email]);
        return rows[0] ?? null;

    }

    async findByIdCard(idCard){
        const[ rows ] = await this.#pool.execute(`${BASE_SELECT} WHERE u.id_card = ?`, [idCard]);
        return rows[0] ?? null;
        
    }

    async create({ idCard, fullName, phone, address, email, password, roleId}){
        const [ result ] = await this.#pool.execute(
            `INSERT INTO users (id_card, full_name, phone, address, email, password, role_id)
            VALUES ( ?, ? , ? , ?, ?, ?, ?)`,
            [idCard, fullName, phone, address, email, password, roleId]

        );
        return result.insertId; 
    }

    async update(id, fields){
        const entries = Object.entries(fields).filter(([key])=>
            Object.hasOwn(UPDATABLE_COLUMNS, key)
       );
       if(entries.length === 0) return;

       const setClause = entries.map(([key])=>`${UPDATABLE_COLUMNS[key]} = ?`).join(', ');
       const values = entries.map(([, value])=>value);

       await this.#pool.execute(
        `UPDATE users SET ${setClause} WHERE user_id = ?`,[...values, id]
           );
    }

    async delete(id){
        await this.#pool.execute('DELETE FROM users WHERE user_id = ?', [id]);
    }
}