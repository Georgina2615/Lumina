import { BOOKING_TIMES } from '../../../../shared/services/AppointmentSchedulePolicy.js';

// Define los estados visibles durante la jornada
export const clinicalAppointmentStatus = Object.freeze({
  pending: 'por_confirmar',
  confirmed: 'confirmada',
  inCabin: 'en_cabina',
  checkout: 'por_cobrar',
  finalized: 'finalizada'
});

const visibleStatuses = new Set(Object.values(clinicalAppointmentStatus));

// Convierte una cita persistida en datos seguros para la agenda
export const mapClinicalAppointment = (id, data) => {
  if (
    typeof id !== 'string'
    || typeof data?.fecha !== 'string'
    || typeof data?.hora !== 'string'
    || typeof data?.nombreCompleto !== 'string'
    || typeof data?.servicio !== 'string'
    || !visibleStatuses.has(data?.estado)
  ) {
    return null;
  }

  return {
    clientId: typeof data.clienteId === 'string' ? data.clienteId : null,
    clientName: data.nombreCompleto.trim(),
    dateKey: data.fecha,
    id,
    serviceName: data.servicio.trim(),
    status: data.estado,
    time: data.hora
  };
};

// Ordena las citas por el inicio del horario
export const sortClinicalAppointments = (appointments) => (
  [...appointments].sort((first, second) => (
    first.time.localeCompare(second.time)
  ))
);

// Separa las citas según el momento operativo
export const groupClinicalAppointments = (appointments) => ({
  active: appointments.filter(({ status }) => (
    status === clinicalAppointmentStatus.inCabin
  )),
  completed: appointments.filter(({ status }) => (
    status === clinicalAppointmentStatus.checkout
    || status === clinicalAppointmentStatus.finalized
  )),
  upcoming: appointments.filter(({ status }) => (
    status === clinicalAppointmentStatus.pending
    || status === clinicalAppointmentStatus.confirmed
  ))
});

// Devuelve el horario completo acordado
export const getClinicalScheduleLabel = (time) => (
  BOOKING_TIMES.find(({ value }) => value === time)?.label ?? time
);
