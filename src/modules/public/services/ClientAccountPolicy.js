const currencyFormatter = new Intl.NumberFormat('es-MX', {
  currency: 'MXN',
  style: 'currency'
});

const dateFormatter = new Intl.DateTimeFormat('es-MX', {
  dateStyle: 'long',
  timeZone: 'America/Mexico_City'
});

export const clientAppointmentStates = Object.freeze({
  por_confirmar: { label: 'Por confirmar', tone: 'pending' },
  confirmada: { label: 'Confirmada', tone: 'confirmed' },
  en_cabina: { label: 'Atención en curso', tone: 'active' },
  por_cobrar: { label: 'Atención terminada', tone: 'active' },
  finalizada: { label: 'Finalizada', tone: 'neutral' },
  cancelada: { label: 'Cancelada', tone: 'error' },
  no_asistio: { label: 'No asistió', tone: 'error' }
});

const finishedStates = new Set(['finalizada', 'cancelada', 'no_asistio']);

// Da formato al anticipo de una cita
export const formatClientDeposit = (amountCents) => (
  currencyFormatter.format((amountCents ?? 0) / 100)
);

// Da formato legible a la fecha
export const formatClientAppointmentDate = (appointment) => {
  const parsedDate = appointment.startAt
    ? new Date(appointment.startAt)
    : new Date(`${appointment.date}T12:00:00-06:00`);
  return Number.isNaN(parsedDate.getTime())
    ? appointment.date
    : dateFormatter.format(parsedDate);
};

// Separa las citas activas del historial
export const groupClientAppointments = (appointments) => ({
  active: appointments.filter(({ status }) => !finishedStates.has(status)),
  history: appointments.filter(({ status }) => finishedStates.has(status))
});
