import ClinicalAppointmentCard from './ClinicalAppointmentCard';

// Presenta un grupo operativo de citas
export default function ClinicalAgendaSection({
  appointments,
  emptyMessage,
  featured = false,
  title
}) {
  return (
    <section aria-labelledby={`clinical-${title.replaceAll(' ', '-').toLowerCase()}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2
          className="text-xl text-primary"
          id={`clinical-${title.replaceAll(' ', '-').toLowerCase()}`}
        >
          {title}
        </h2>
        <span className="rounded-full bg-surface px-3 py-1 text-xs font-semibold text-muted shadow-sm">
          {appointments.length}
        </span>
      </div>

      {appointments.length > 0 ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {appointments.map((appointment) => (
            <ClinicalAppointmentCard
              appointment={appointment}
              featured={featured}
              key={appointment.id}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-surface-hover bg-surface/60 px-5 py-8 text-center text-sm text-muted">
          {emptyMessage}
        </div>
      )}
    </section>
  );
}
