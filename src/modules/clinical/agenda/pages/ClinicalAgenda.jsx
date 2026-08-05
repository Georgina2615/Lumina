import { FiCalendar, FiRefreshCw } from 'react-icons/fi';
import ClinicalAgendaSection from '../components/ClinicalAgendaSection';
import { useClinicalAgenda } from '../hooks/UseClinicalAgenda';

const dateFormatter = new Intl.DateTimeFormat('es-MX', {
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
  weekday: 'long',
  year: 'numeric'
});

// Formatea la fecha civil sin desplazarla de día
const formatAgendaDate = (dateKey) => {
  const formattedDate = dateFormatter.format(new Date(`${dateKey}T00:00:00Z`));
  return formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
};

// Presenta la jornada operativa de la cosmetóloga
export default function ClinicalAgenda() {
  const agenda = useClinicalAgenda();

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.22em] text-secondary">
            Cabina
          </p>
          <h1 className="text-3xl text-primary sm:text-4xl">Mi agenda</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted sm:text-base">
            <FiCalendar aria-hidden="true" />
            {formatAgendaDate(agenda.dateKey)}
          </p>
        </div>
        <button
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-surface-hover bg-surface px-4 text-sm font-semibold text-primary shadow-sm transition hover:bg-surface-hover/50 disabled:cursor-wait disabled:opacity-60"
          disabled={agenda.isLoading}
          onClick={agenda.refresh}
          type="button"
        >
          <FiRefreshCw
            aria-hidden="true"
            className={agenda.isLoading ? 'motion-safe:animate-spin' : ''}
          />
          Actualizar
        </button>
      </header>

      {agenda.error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-error/20 bg-error/10 px-4 py-3" role="alert">
          <p className="text-sm font-medium text-error">{agenda.error}</p>
          <button className="min-h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-surface" onClick={agenda.refresh} type="button">
            Reintentar
          </button>
        </div>
      )}

      {agenda.isLoading ? (
        <div aria-label="Cargando agenda" className="grid gap-4 sm:grid-cols-2" role="status">
          {[0, 1].map((item) => (
            <div className="h-36 animate-pulse rounded-2xl border border-surface-hover bg-surface" key={item} />
          ))}
        </div>
      ) : (
        <div className="space-y-7">
          <ClinicalAgendaSection appointments={agenda.groups.active} emptyMessage="No hay ninguna clienta en cabina" featured title="En cabina" />
          <ClinicalAgendaSection appointments={agenda.groups.upcoming} emptyMessage="No hay más citas programadas para hoy" title="Próximas citas" />
          <ClinicalAgendaSection appointments={agenda.groups.completed} emptyMessage="Todavía no hay sesiones terminadas" title="Sesiones terminadas" />
        </div>
      )}
    </div>
  );
}
