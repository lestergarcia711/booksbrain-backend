import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy } from 'passport-jwt';

// Configura las estrategias stateless (session: false) de Passport para login local y JWT en cookie.
export default class PassportConfig {
  #passport;
  #authService;
  #tokenService;

  constructor(passport, authService, tokenService) {
    this.#passport = passport;
    this.#authService = authService;
    this.#tokenService = tokenService;
  }

  initialize() {
    this.#passport.use(
      'local',
      new LocalStrategy(
        {
          usernameField: 'email',
          passwordField: 'password',
          session: false,
        },
        async (email, password, done) => {
          try {
            const user = await this.#authService.verifyCredentials(email, password);
            return done(null, user);
          } catch (error) {
            return done(error, false);
          }
        }
      )
    );

    this.#passport.use(
      'jwt',
      new JwtStrategy(
        {
          jwtFromRequest: (req) => req?.cookies?.[this.#tokenService.cookieName] ?? null,
          secretOrKey: this.#tokenService.secret,
          algorithms: ['HS256'],
        },
        (payload, done) => {
          if (!payload?.sub || !payload?.role) {
            return done(null, false);
          }
          return done(null, {
            id: Number(payload.sub),
            role: payload.role,
          });
        }
      )
    );

    return this.#passport.initialize();
  }
}
