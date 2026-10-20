import bcrypt from 'bcrypt';

// Encapsula el hash y la verificación de contraseñas con bcrypt.
export default class PasswordHasher {
    #saltRounds;

    constructor(saltRounds){
        this.#saltRounds = saltRounds;
        }

        hash(plainPassword){
            return bcrypt.hash(plainPassword, this.#saltRounds);

        }

        compare(plainPassword, hashedPassword){
            return bcrypt.compare(plainPassword, hashedPassword);
            
        }
}