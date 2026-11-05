// Clase de constantes para los roles del sistema según la tabla `roles`.
export default class RoleConstants {
  static get ADMIN() {
    return 'Administrator';
  }

  static get CLIENT() {
    return 'Client';
  }

  static get ALL() {
    return Object.freeze([RoleConstants.ADMIN, RoleConstants.CLIENT]);
  }
}

export const ROLES = Object.freeze({
  ADMIN: RoleConstants.ADMIN,
  CLIENT: RoleConstants.CLIENT,
});
