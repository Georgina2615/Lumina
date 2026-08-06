import { FiCalendar } from 'react-icons/fi';
import ClientAppointmentCard from './ClientAppointmentCard';

// Presenta un grupo de citas o su estado vacío
export default function ClientAppointmentList({ appointments, emptyText, title }) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-2xl">{title}</h2>
        <span className="rounded-full bg-surface px-3 py-1 text-xs font-semibold text-muted">
          {appointments.length}
        </span>
      </div>
      {appointments.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {appointments.map((appointment) => (
            <ClientAppointmentCard appointment={appointment} key={appointment.id} />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-surface-hover bg-surface/60 px-6 py-10 text-center">
          <FiCalendar aria-hidden="true" className="mx-auto text-muted" size={25} />
          <p className="mt-3 text-sm text-muted">{emptyText}</p>
        </div>
      )}
    </section>
  );
}
