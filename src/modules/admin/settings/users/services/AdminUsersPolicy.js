// Define los roles válidos del sistema
export const validAdminUserRoles = ['admin', 'recepcion', 'cosmetologa'];

// Formato inicial del formulario de usuario
export const createUserFormState = (user = null) => ({
  email: user?.email ?? '',
  password: user?.password ?? '',
  createAuth: user?.createAuth ?? false,
  role: user?.role ?? 'recepcion',
  active: user?.active ?? true
});

// Valida que el formulario contenga los campos necesarios
export const validateUserForm = (form) => {
  const email = form.email.trim();
  const normalized = email.toLowerCase();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email || !emailPattern.test(normalized)) {
    return 'Escribe un correo electrónico válido';
  }

  if (!validAdminUserRoles.includes(form.role)) {
    return 'Selecciona un rol válido';
  }

  if (typeof form.active !== 'boolean') {
    return 'El estado de la cuenta debe ser verdadero o falso';
  }

  if (form.createAuth === true) {
    if (!form.password || String(form.password).length < 6) {
      return 'La contraseña es requerida y debe tener al menos 6 caracteres';
    }
  }

  return null;
};

// Convierte el formulario al contrato seguro para Firestore
export const buildUserCommand = (form) => ({
  correo: form.email.trim().toLowerCase(),
  rol: form.role,
  activo: form.active
  ,
  // Campos auxiliares para operaciones especiales (no se almacenan en el documento por defecto)
  createAuth: !!form.createAuth,
  password: form.password ?? undefined
});
