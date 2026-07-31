// Define los estados persistentes de las citas
export const appointmentStatus = Object.freeze({
  pending: 'por_confirmar',
  confirmed: 'confirmada',
  inCabin: 'en_cabina',
  checkout: 'por_cobrar',
  finalized: 'finalizada',
  cancelled: 'cancelada',
  noShow: 'no_asistio'
});

// Define los canales válidos de confirmación
export const confirmationChannel = Object.freeze({
  email: 'correo',
  phoneCall: 'llamada',
  whatsapp: 'whatsapp',
  inPerson: 'presencial'
});

// Define los orígenes válidos de cancelación
export const cancellationOrigin = Object.freeze({
  client: 'cliente',
  clinic: 'clinica'
});

// Define los estados que permiten cancelación
const cancellableStatuses = new Set([
  appointmentStatus.pending,
  appointmentStatus.confirmed
]);

// Define los estados que permiten registrar inasistencia
const noShowStatuses = new Set([
  appointmentStatus.pending,
  appointmentStatus.confirmed
]);

// Convierte el inicio persistido en una fecha local
export const getAppointmentStart = (appointment) => {
  // Usa la marca temporal canónica cuando existe
  if (typeof appointment?.inicio?.toDate === 'function') {
    return appointment.inicio.toDate();
  }

  // Conserva fechas ya convertidas
  if (appointment?.inicio instanceof Date) {
    return appointment.inicio;
  }

  // Reconstruye citas heredadas desde fecha y hora
  const fallback = new Date(
    `${appointment?.fecha ?? ''}T${appointment?.hora ?? ''}:00`
  );

  // Descarta valores incompletos
  return Number.isNaN(fallback.getTime()) ? null : fallback;
};

// Comprueba si una cita puede cancelarse
export const canCancelAppointment = (appointment) => (
  cancellableStatuses.has(appointment?.estado)
);

// Comprueba si ya venció la tolerancia de asistencia
export const canMarkAppointmentNoShow = (
  appointment,
  currentTime,
  toleranceMinutes = 15
) => {
  // Detiene estados fuera del flujo operativo
  if (!noShowStatuses.has(appointment?.estado)) {
    return false;
  }

  // Obtiene el inicio real de la cita
  const appointmentStart = getAppointmentStart(appointment);

  // Detiene citas sin un horario válido
  if (!appointmentStart) {
    return false;
  }

  // Compara con la tolerancia acordada
  const threshold = appointmentStart.getTime() + toleranceMinutes * 60 * 1000;
  return currentTime.getTime() >= threshold;
};

// Limita las pendientes al horizonte operativo
export const filterOperationalPendingAppointments = ({
  appointments,
  currentTime,
  horizonHours = 24
}) => {
  // Calcula el inicio del día para conservar vencidas de hoy
  const startOfToday = new Date(currentTime);
  startOfToday.setHours(0, 0, 0, 0);

  // Calcula el límite futuro exacto
  const horizon = currentTime.getTime() + horizonHours * 60 * 60 * 1000;

  // Conserva solo citas útiles para recepción
  return appointments.filter((appointment) => {
    const start = getAppointmentStart(appointment);

    return start
      && start.getTime() >= startOfToday.getTime()
      && start.getTime() <= horizon;
  });
};
