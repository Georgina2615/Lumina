// Define los datos visibles del negocio
const BUSINESS = Object.freeze({
  name: 'Lumina Skin',
  email: 'luminask01@gmail.com',
  phone: '981 101 7687',
  address: 'Avenida Adolfo López Mateos 426 Campeche Campeche',
  cancellationUrl: 'https://lumina-f247c.web.app/politica-cancelacion'
});

// Define la zona horaria de la sucursal
const BUSINESS_TIME_ZONE = 'America/Mexico_City';

// Configura la moneda visible
const currencyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2
});

// Configura la fecha visible
const dateFormatter = new Intl.DateTimeFormat('es-MX', {
  dateStyle: 'long',
  timeZone: BUSINESS_TIME_ZONE
});

// Configura el horario visible
const timeFormatter = new Intl.DateTimeFormat('es-MX', {
  hour: 'numeric',
  minute: '2-digit',
  timeZone: BUSINESS_TIME_ZONE
});

// Limpia texto requerido
const requireText = (value, message) => {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (!normalized) throw new Error(message);
  return normalized;
};

// Valida el correo destinatario
const requireEmail = (value) => {
  const email = requireText(value, 'La cita no tiene correo').toLowerCase();
  if (
    email.length > 254
    || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    throw new Error('El correo de la cita no es válido');
  }
  return email;
};

// Convierte el inicio persistido
const requireStart = (appointment) => {
  const value = appointment?.inicio;
  const date = typeof value?.toDate === 'function'
    ? value.toDate()
    : value instanceof Date
      ? value
      : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error('La cita no tiene un horario válido');
  }
  return date;
};

// Construye un folio reconocible
const buildAppointmentFolio = (appointmentId) => {
  const id = requireText(appointmentId, 'La cita no tiene folio');
  if (id.length > 500 || id.includes('/')) {
    throw new Error('El folio de la cita no es válido');
  }
  return `LS-CITA-${id.slice(-8).toUpperCase()}`;
};

// Construye las variables de la plantilla
export const buildAppointmentEmailParameters = ({
  appointment,
  appointmentId,
  client
}) => {
  if (
    !appointment
    || appointment.estado !== 'por_confirmar'
    || appointment.schemaVersion !== 3
    || !Number.isSafeInteger(appointment.anticipoMontoCentavos)
    || appointment.anticipoMontoCentavos <= 0
  ) {
    throw new Error('La cita no tiene información válida para el correo');
  }

  const start = requireStart(appointment);
  return {
    to_email: requireEmail(client?.emailNormalizado || client?.email),
    client_name: requireText(
      client?.nombreCompleto || appointment.nombreCompleto,
      'La cita no tiene nombre de cliente'
    ),
    service_name: requireText(
      appointment.servicio,
      'La cita no tiene servicio'
    ),
    appointment_date: dateFormatter.format(start),
    appointment_time: timeFormatter.format(start),
    deposit: currencyFormatter.format(
      appointment.anticipoMontoCentavos / 100
    ),
    appointment_folio: buildAppointmentFolio(appointmentId),
    cancellation_url: BUSINESS.cancellationUrl,
    business_name: BUSINESS.name,
    business_email: BUSINESS.email,
    business_phone: BUSINESS.phone,
    business_address: BUSINESS.address
  };
};
