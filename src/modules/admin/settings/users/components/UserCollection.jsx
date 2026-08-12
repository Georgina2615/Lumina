import { FiEdit3, FiUserPlus } from 'react-icons/fi';

const UserCard = ({ user, onEdit, onToggle, onDelete }) => (
  <article className="group flex h-full flex-col justify-between rounded-2xl border border-surface-hover bg-surface p-5 shadow-sm transition duration-200 motion-safe:hover:-translate-y-0.5 hover:border-secondary/30 hover:shadow-md">
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-secondary">
        {user.role === 'admin' ? 'Administrador' : user.role === 'recepcion' ? 'Recepción' : 'Cosmetóloga'}
      </p>
      <h2 className="mt-3 text-xl leading-tight text-primary break-words">
        {user.email}
      </h2>
      <p className={`mt-4 inline-flex rounded-full px-3 py-2 text-xs font-semibold ${
        user.active ? 'bg-status-confirmed/20 text-primary' : 'bg-surface-hover text-muted'
      }`}>
        {user.active ? 'Activo' : 'Inactivo'}
      </p>
    </div>
    <div className="mt-6 flex gap-2">
      <button
        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-surface-hover px-3 text-sm font-semibold text-primary transition hover:border-secondary/40 hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
        onClick={() => onEdit(user)}
        type="button"
      >
        <FiEdit3 aria-hidden="true" />
        Editar
      </button>
      <button
        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-surface-hover px-3 text-sm font-semibold text-primary transition hover:border-secondary/40 hover:bg-background disabled:opacity-60"
        onClick={() => onToggle(user)}
        type="button"
      >
        {user.active ? 'Desactivar' : 'Activar'}
      </button>
      <button
        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-error px-3 text-sm font-semibold text-error transition hover:bg-error/10"
        onClick={() => {
          if (confirm('¿Eliminar esta cuenta? Esta acción no se puede deshacer.')) {
            onDelete(user);
          }
        }}
        type="button"
      >
        Eliminar
      </button>
    </div>
  </article>
);

export default function UserCollection({ loading, onCreate, onEdit, onToggle, onDelete, users }) {
  if (loading) {
    return (
      <div
        aria-busy="true"
        aria-label="Cargando usuarios"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
        role="status"
      >
        <span className="sr-only">Cargando usuarios</span>
        {[1, 2, 3, 4, 5].map((item) => (
          <div
            className="h-56 rounded-2xl border border-surface-hover bg-surface motion-safe:animate-pulse"
            key={item}
          />
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-surface-hover bg-surface px-5 py-10 text-center">
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-background text-muted">
          <FiUserPlus aria-hidden="true" size={24} />
        </span>
        <h2 className="text-xl text-primary">No hay cuentas registradas</h2>
        <p className="mt-1 max-w-sm text-sm text-muted">
          Crea la primera cuenta para el equipo de Lumina.
        </p>
        <button
          className="mt-5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-surface transition motion-safe:hover:-translate-y-0.5 hover:shadow-md"
          onClick={onCreate}
          type="button"
        >
          Crear cuenta
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {users.map((user) => (
        <UserCard key={user.id} onEdit={onEdit} onToggle={onToggle} onDelete={onDelete} user={user} />
      ))}
    </div>
  );
}
