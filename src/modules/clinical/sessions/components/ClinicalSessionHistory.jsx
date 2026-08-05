import { FiCalendar, FiCamera, FiClock } from 'react-icons/fi';
import ClinicalPrivatePhoto from './ClinicalPrivatePhoto';

const dateFormatter = new Intl.DateTimeFormat('es-MX', {
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
  year: 'numeric'
});

// Formatea una fecha civil sin cambiar el día
const formatSessionDate = (dateKey) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return 'Fecha no disponible';
  return dateFormatter.format(new Date(`${dateKey}T00:00:00Z`));
};

// Presenta el historial real de sesiones de una clienta
export default function ClinicalSessionHistory({ sessions }) {
  return (
    <section className="mt-7 border-t border-surface-hover pt-7">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Evolución</p>
          <h2 className="mt-1 text-2xl text-primary">Sesiones anteriores</h2>
        </div>
        <span className="rounded-full bg-surface px-3 py-1 text-xs font-semibold text-muted shadow-sm">{sessions.length}</span>
      </div>

      {sessions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-surface-hover bg-surface/60 px-5 py-8 text-center text-sm text-muted">Todavía no hay seguimientos guardados</div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <article className="rounded-2xl border border-surface-hover bg-surface p-4 shadow-sm sm:p-5" key={session.appointmentId}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl text-primary">{session.performedTreatment || session.scheduledTreatment}</h3>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted">
                    <span className="inline-flex items-center gap-1"><FiCalendar aria-hidden="true" />{formatSessionDate(session.appointmentDate)}</span>
                    <span className="inline-flex items-center gap-1"><FiClock aria-hidden="true" />{session.scheduledTime}</span>
                  </div>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${session.status === 'completed' ? 'bg-status-confirmed/15 text-status-confirmed' : 'bg-status-pending/15 text-secondary'}`}>{session.status === 'completed' ? 'Completo' : 'Borrador'}</span>
              </div>
              <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                <div><dt className="font-semibold text-primary">Antes</dt><dd className="mt-1 whitespace-pre-wrap text-muted">{session.beforeObservations || 'Sin observaciones guardadas'}</dd></div>
                <div><dt className="font-semibold text-primary">Después</dt><dd className="mt-1 whitespace-pre-wrap text-muted">{session.afterObservations || 'Sin observaciones guardadas'}</dd></div>
              </dl>
              {(session.photos.beforePath || session.photos.afterPath) && (
                <div className="mt-4 grid gap-3 border-t border-surface-hover pt-4 sm:grid-cols-2">
                  {session.photos.beforePath && <figure><ClinicalPrivatePhoto alt="Fotografía anterior al tratamiento" className="aspect-[4/3] w-full rounded-xl" imagePath={session.photos.beforePath} /><figcaption className="mt-1 flex items-center gap-1 text-xs text-muted"><FiCamera aria-hidden="true" />Antes</figcaption></figure>}
                  {session.photos.afterPath && <figure><ClinicalPrivatePhoto alt="Fotografía posterior al tratamiento" className="aspect-[4/3] w-full rounded-xl" imagePath={session.photos.afterPath} /><figcaption className="mt-1 flex items-center gap-1 text-xs text-muted"><FiCamera aria-hidden="true" />Después</figcaption></figure>}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
