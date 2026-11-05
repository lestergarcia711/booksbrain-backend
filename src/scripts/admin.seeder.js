import 'dotenv/config';
import { pool } from '../config/database.config.js';
import { container } from '../container.js';
import { ROLES } from '../constants/roles.constants.js';

// Crea el primer usuario Administrador sin contraseña fija en el código fuente.
export default class AdminSeeder {
  #userRepository;
  #roleRepository;
  #passwordHasher;
  #pool;

  constructor({ userRepository, roleRepository, passwordHasher, dbPool }) {
    this.#userRepository = userRepository;
    this.#roleRepository = roleRepository;
    this.#passwordHasher = passwordHasher;
    this.#pool = dbPool;
  }

  async run(processEnv = process.env) {
    const idCard = (processEnv.ADMIN_ID_CARD ?? '1000000001').trim();
    const fullName = (processEnv.ADMIN_FULL_NAME ?? 'Administrador Principal').trim();
    const email = (processEnv.ADMIN_EMAIL ?? 'admin@library.local').trim().toLowerCase();
    const phone = processEnv.ADMIN_PHONE ?? null;
    const address = processEnv.ADMIN_ADDRESS ?? null;

    const adminRole = await this.#roleRepository.findByName(ROLES.ADMIN);
    if (!adminRole) {
      throw new Error('El rol Administrator no existe en la tabla roles');
    }

    const existingByEmail = await this.#userRepository.findByEmail(email);
    if (existingByEmail) {
      console.log(`Ya existe un usuario registrado con el correo: ${email}`);
      return { created: false, email };
    }

    // Nunca se fija una contraseña en el código: se lee de ADMIN_PASSWORD o se genera con crypto.
    const plainPassword =
      processEnv.ADMIN_PASSWORD && processEnv.ADMIN_PASSWORD.trim().length >= 8
        ? processEnv.ADMIN_PASSWORD.trim()
        : this.#passwordHasher.generateRandomPassword(14);

    const hashedPassword = await this.#passwordHasher.hash(plainPassword);

    const userId = await this.#userRepository.create({
      idCard,
      fullName,
      phone,
      address,
      email,
      password: hashedPassword,
      roleId: adminRole.role_id,
    });

    console.log('====================================================');
    console.log('Primer Administrador creado exitosamente');
    console.log(`ID: ${userId}`);
    console.log(`Correo: ${email}`);
    console.log(`Contrasenia generada (guardar ahora, no se volvera a mostrar): ${plainPassword}`);
    console.log('====================================================');

    return { created: true, userId, email, temporaryPassword: plainPassword };
  }

  async close() {
    await this.#pool.end();
  }
}

// Permite ejecutar el script directamente desde terminal: npm run seed:admin
if (import.meta.url === `file://${process.argv[1]}`) {
  const seeder = new AdminSeeder({
    userRepository: container.repositories.userRepository,
    roleRepository: container.repositories.roleRepository,
    passwordHasher: container.passwordHasher,
    dbPool: pool,
  });

  seeder
    .run()
    .then(() => seeder.close())
    .catch(async (error) => {
      console.error('Error al crear el administrador inicial:', error.message);
      await seeder.close();
      process.exit(1);
    });
}
