import { FiCalendar, FiClock, FiLock, FiUnlock } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const stateContent = {
  appointment: {
    icon: FiCalendar,
    label: 'Con cita',
    style: 'bg-status-incabin/10 text-status-incabin'
  },
  available: {
    icon: FiUnlock,
    label: 'Disponible',
    style: 'bg-status-confirmed/15 text-status-confirmed'
  },
  blocked: {
    icon: FiLock,
    label: 'Bloqueado',
    style: 'bg-status-pending/20 text-primary'
  },
  unavailable: {
    icon: FiClock,
    label: 'No disponible',
    style: 'bg-surface-hover text-muted'
  }
};

// Presenta los tres horarios operativos
export default function AvailabilitySlotList({
  loading,
  onBlock,
  onReopen,
  slots
}) {
  // Presenta esqueletos durante la consulta
  if (loading) {
    return (
      <div aria-label="Consultando horarios" className="grid gap-4 md:grid-cols-3" role="status">
        {[1, 2, 3].map((item) => (
          <div className="h-44 rounded-2xl border border-surface-hover bg-surface motion-safe:animate-pulse" key={item} />
        ))}
      </div>
    );
  }

  // Devuelve una tarjeta por horario
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {slots.map((slot) => {
        const content = stateContent[slot.state];
        const StateIcon = content.icon;

        return (
          <article className="flex min-h-44 flex-col rounded-2xl border border-surface-hover bg-surface p-5 shadow-sm" key={slot.time}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Horario
                </p>
                <h2 className="mt-1 text-xl text-primary">
                  {slot.label}
                </h2>
              </div>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${content.style}`}>
                <StateIcon aria-hidden="true" />
                {content.label}
              </span>
            </div>

            {slot.state === 'blocked' && slot.reason && (
              <p className="mt-3 text-sm text-muted">{slot.reason}</p>
            )}

            <div className="mt-auto pt-5">
              {slot.state === 'available' && (
                <button className="min-h-11 w-full rounded-xl border border-surface-hover text-sm font-semibold text-primary transition hover:border-secondary/40 hover:bg-background" onClick={() => onBlock(slot)} type="button">
                  Bloquear horario
                </button>
              )}
              {slot.state === 'blocked' && (
                <button className="min-h-11 w-full rounded-xl bg-primary text-sm font-semibold text-surface transition hover:bg-secondary" onClick={() => onReopen(slot)} type="button">
                  Reabrir horario
                </button>
              )}
              {slot.state === 'appointment' && (
                <Link className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-surface-hover text-sm font-semibold text-primary transition hover:bg-background" to="/dashboard/reception/agenda">
                  Ver en agenda
                </Link>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
