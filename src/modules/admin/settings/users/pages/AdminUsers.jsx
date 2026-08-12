import { FiCheckCircle, FiPlus, FiRefreshCw, FiX } from 'react-icons/fi';
import UserCollection from '../components/UserCollection';
import UserFormModal from '../components/UserFormModal';
import { useAdminUsers } from '../hooks/UseAdminUsers';

export default function AdminUsers() {
  const adminUsers = useAdminUsers();

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.22em] text-secondary">
            Administración
          </p>
          <h1 className="text-3xl text-primary sm:text-4xl">
            Cuentas de personal
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted sm:text-base">
            Crea y asigna roles para que el personal acceda a su sección.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            aria-label="Actualizar cuentas"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-surface-hover bg-surface px-4 text-sm font-semibold text-primary transition hover:bg-surface-hover/50"
            disabled={adminUsers.isLoading || adminUsers.error}
            onClick={adminUsers.refreshUsers}
            type="button"
          >
            <FiRefreshCw aria-hidden="true" className={adminUsers.isLoading ? 'motion-safe:animate-spin' : ''} />
            <span className="hidden sm:inline">
              {adminUsers.isLoading ? 'Actualizando' : 'Actualizar'}
            </span>
          </button>
          <button
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-surface shadow-sm transition motion-safe:hover:-translate-y-0.5 hover:bg-secondary hover:shadow-md"
            disabled={adminUsers.isLoading}
            onClick={adminUsers.openCreateForm}
            type="button"
          >
            <FiPlus aria-hidden="true" />
            Nueva cuenta
          </button>
        </div>
      </header>

      {adminUsers.feedback && (
        <div className="flex items-start gap-3 rounded-2xl border border-status-confirmed/30 bg-status-confirmed/10 px-4 py-3 shadow-sm" role="status">
          <FiCheckCircle className="mt-0.5 text-status-confirmed" />
          <p className="min-w-0 flex-1 text-sm font-medium text-primary">
            {adminUsers.feedback.message}
          </p>
          <button
            aria-label="Cerrar aviso"
            className="rounded-lg p-1 text-muted hover:bg-background hover:text-primary"
            onClick={() => adminUsers.setFeedback(null)}
            type="button"
          >
            <FiX aria-hidden="true" />
          </button>
        </div>
      )}

      {adminUsers.error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-error/20 bg-error/10 px-4 py-3" role="alert">
          <p className="text-sm font-medium text-error">{adminUsers.error}</p>
          <button
            className="min-h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-surface"
            onClick={adminUsers.refreshUsers}
            type="button"
          >
            Reintentar
          </button>
        </div>
      )}

      <UserCollection
        loading={adminUsers.isLoading}
        onCreate={adminUsers.openCreateForm}
        onEdit={adminUsers.openEditForm}
        onToggle={adminUsers.toggleActive}
        onDelete={adminUsers.deleteUser}
        users={adminUsers.users}
      />

      {adminUsers.formOpen && (
        <UserFormModal
          busy={adminUsers.isMutating}
          error={adminUsers.mutationError}
          onClearError={adminUsers.clearMutationError}
          onClose={adminUsers.closeForm}
          onSubmit={adminUsers.createUser}
          user={adminUsers.formUser}
        />
      )}
    </div>
  );
}
