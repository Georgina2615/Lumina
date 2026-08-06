import { FiLogOut, FiRefreshCw } from 'react-icons/fi';
import {
  ClientAccountAccess,
  ClientAppointmentList
} from '../components';
import { useClientAccount } from '../hooks/UseClientAccount';

// Compone la cuenta privada de la clienta
export default function ClientAccountPage() {
  const account = useClientAccount();

  if (!account.user) {
    return (
      <section className="bg-background px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
        <div className="mb-9 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-secondary">Mi cuenta</p>
          <h1 className="mt-3 text-4xl sm:text-5xl">Tu espacio en Lumina Skin</h1>
        </div>
        <ClientAccountAccess connecting={account.connecting} error={account.error} onConnect={account.connect} />
      </section>
    );
  }

  return (
    <section className="bg-background px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-secondary">Mi cuenta</p>
            <h1 className="mt-3 text-4xl sm:text-5xl">
              {account.account?.client?.name
                ? `Hola ${account.account.client.name.split(' ')[0]}`
                : 'Tus citas'}
            </h1>
            <p className="mt-3 text-sm text-muted">{account.user.email}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button aria-label="Actualizar citas" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-surface-hover bg-surface px-4 text-sm font-semibold transition hover:bg-surface-hover disabled:opacity-50" disabled={account.loading} onClick={account.refresh} type="button"><FiRefreshCw aria-hidden="true" className={account.loading ? 'animate-spin' : ''} />Actualizar</button>
            <button className="inline-flex min-h-11 items-center gap-2 rounded-full border border-surface-hover px-4 text-sm font-semibold text-secondary transition hover:bg-surface" onClick={account.disconnect} type="button"><FiLogOut aria-hidden="true" />Cerrar sesión</button>
          </div>
        </div>

        {account.loading && !account.account && <p className="mt-10 animate-pulse rounded-3xl bg-surface px-6 py-12 text-center text-sm text-muted">Consultando tus citas</p>}
        {account.error && <div className="mt-8 rounded-3xl border border-error/20 bg-error/10 px-6 py-5" role="alert"><p className="text-sm text-error">{account.error}</p><p className="mt-2 text-xs leading-5 text-muted">Si utilizaste otro correo al reservar puedes comunicarte con recepción para corregirlo</p></div>}
        {account.account && (
          <div className="mt-10 space-y-12">
            <ClientAppointmentList appointments={account.appointments.active} emptyText="No tienes citas activas" title="Próximas citas" />
            <ClientAppointmentList appointments={account.appointments.history} emptyText="Tu historial aparecerá después de tus citas" title="Historial" />
          </div>
        )}
      </div>
    </section>
  );
}
