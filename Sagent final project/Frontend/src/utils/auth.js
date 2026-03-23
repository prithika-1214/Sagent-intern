export const USER_ROLES = {
  USER: 'USER',
  ADMIN: 'ADMIN'
};

export const normalizeRole = (value) => String(value || USER_ROLES.USER).toUpperCase();

export const getDefaultRouteForRole = (role) => {
  const normalizedRole = normalizeRole(role);
  if (normalizedRole === USER_ROLES.ADMIN) {
    return '/admin';
  }
  return '/';
};

export const canAccessAdmin = (role) => {
  const normalizedRole = normalizeRole(role);
  return normalizedRole === USER_ROLES.ADMIN;
};

export const isRoleAllowed = (role, allowedRoles = []) => {
  if (!allowedRoles.length) {
    return true;
  }
  const normalizedRole = normalizeRole(role);
  return allowedRoles.map((item) => normalizeRole(item)).includes(normalizedRole);
};
