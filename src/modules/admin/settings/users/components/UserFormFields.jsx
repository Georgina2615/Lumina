import { validAdminUserRoles } from '../services/AdminUsersPolicy';

export default function UserFormFields({ form, onFieldChange }) {
  return (
    <div className="grid gap-5">
      <label className="grid gap-2 text-sm font-medium text-primary">
        Correo electrónico
        <input
          className="min-h-11 rounded-xl border border-surface-hover bg-background px-4 text-primary outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/20"
          name="email"
          type="email"
          value={form.email}
          onChange={(event) => onFieldChange('email', event.target.value)}
        />
      </label>
      <label className="grid gap-2 text-sm font-medium text-primary">
        Rol
        <select
          className="min-h-11 rounded-xl border border-surface-hover bg-background px-4 text-primary outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/20"
          value={form.role}
          onChange={(event) => onFieldChange('role', event.target.value)}
        >
          {validAdminUserRoles.map((role) => (
            <option key={role} value={role}>
              {role === 'admin' ? 'Administrador' : role === 'recepcion' ? 'Recepción' : 'Cosmetóloga'}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-3 text-sm font-medium text-primary">
        <input
          checked={form.createAuth}
          className="h-5 w-5 rounded border border-surface-hover text-primary focus:ring-secondary"
          onChange={(event) => onFieldChange('createAuth', event.target.checked)}
          type="checkbox"
        />
        Crear cuenta en el sistema
      </label>

      {form.createAuth && (
        <label className="grid gap-2 text-sm font-medium text-primary">
          Contraseña
          <input
            className="min-h-11 rounded-xl border border-surface-hover bg-background px-4 text-primary outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/20"
            name="password"
            type="password"
            value={form.password}
            onChange={(event) => onFieldChange('password', event.target.value)}
          />
        </label>
      )}

      <label className="flex items-center gap-3 text-sm font-medium text-primary">
        <input
          checked={form.active}
          className="h-5 w-5 rounded border border-surface-hover text-primary focus:ring-secondary"
          onChange={(event) => onFieldChange('active', event.target.checked)}
          type="checkbox"
        />
        Cuenta activa
      </label>
    </div>
  );
}
