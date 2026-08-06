import {
  BOOKING_TIMES,
  buildBookingInterval
} from '../../../shared/services/AppointmentSchedulePolicy';
import {
  normalizeClientEmail,
  normalizeClientFullName,
  normalizeClientPhone
} from '../../../shared/services/ClientContactPolicy';

// Define la anticipacion publica vigente
export const publicNoticeMinutes = 120;

// Genera un folio visible para la transferencia
export const createPublicPaymentReference = () => (
  `LS-WEB-${crypto.randomUUID().replaceAll('-', '').slice(0, 8).toUpperCase()}`
);

// Formatea importes publicos en pesos
export const formatPublicPrice = (priceCents) => new Intl.NumberFormat('es-MX', {
  currency: 'MXN',
  style: 'currency'
}).format(priceCents / 100);

// Normaliza los datos de contacto publicos
export const normalizePublicClient = (fields) => ({
  fullName: normalizeClientFullName(fields.fullName),
  phone: normalizeClientPhone(fields.phone),
  email: normalizeClientEmail(fields.email, { required: true })
});

// Construye las opciones disponibles para internet
export const buildPublicTimeOptions = ({ dateKey, availability, now = new Date() }) => (
  BOOKING_TIMES.map((option) => {
    const serverOption = availability.find(({ time }) => time === option.value);
    let validNotice;
    try {
      const interval = buildBookingInterval({ dateKey, time: option.value });
      validNotice = interval.start.getTime()
        >= now.getTime() + publicNoticeMinutes * 60 * 1000;
    } catch {
      validNotice = false;
    }
    const available = serverOption?.available === true && validNotice;
    return {
      ...option,
      disabled: !available,
      status: available ? 'Disponible' : 'No disponible'
    };
  })
);

// Valida el primer paso del formulario
export const validatePublicServiceStep = ({ serviceId }) => {
  if (!serviceId) throw new Error('Selecciona el tratamiento que deseas');
};

// Valida los datos y el horario
export const validatePublicDetailsStep = (fields) => {
  const client = normalizePublicClient(fields);
  if (!fields.dateKey) throw new Error('Selecciona una fecha');
  const selectedTime = buildPublicTimeOptions({
    availability: fields.availability,
    dateKey: fields.dateKey
  }).find(({ value }) => value === fields.time);
  if (!selectedTime || selectedTime.disabled) {
    throw new Error('Selecciona un horario disponible');
  }
  return client;
};

// Valida el pago y las autorizaciones
export const validatePublicPaymentStep = (fields) => {
  if (!fields.proofDataUrl) throw new Error('Adjunta el comprobante de transferencia');
  if (!fields.privacyAccepted || !fields.termsAccepted || !fields.cancellationAccepted) {
    throw new Error('Acepta los documentos informativos para continuar');
  }
};
