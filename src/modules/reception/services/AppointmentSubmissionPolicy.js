import { buildDepositInput } from './PaymentPolicy.js';

// Construye el comando final de una cita
export const buildAppointmentSubmission = ({
  activeClient,
  appointment,
  availableCredits,
  creditChoice,
  payment,
  requiredDepositCents,
  servicePriceCents
}) => {
  // Exige una decisión cuando existe crédito
  if (availableCredits.length > 0 && creditChoice === null) {
    throw new Error('Elige si deseas aplicar el crédito disponible');
  }

  // Obtiene el crédito todavía disponible
  const selectedCredit = availableCredits.find(
    (credit) => credit.sourceAppointmentId === creditChoice
  ) ?? null;

  // Detiene selecciones que cambiaron en el servidor
  if (
    creditChoice
    && creditChoice !== 'none'
    && !selectedCredit
  ) {
    throw new Error('El crédito seleccionado ya no está disponible');
  }

  // Impide aplicar crédito por encima del servicio
  if (selectedCredit && selectedCredit.creditCents > servicePriceCents) {
    throw new Error('El crédito supera el precio del servicio seleccionado');
  }

  // Calcula únicamente la diferencia por cobrar
  const additionalDepositCents = Math.max(
    requiredDepositCents - (selectedCredit?.creditCents ?? 0),
    0
  );

  // Construye una reprogramación con crédito
  if (selectedCredit) {
    return {
      type: 'reschedule',
      request: {
        sourceAppointmentId: selectedCredit.sourceAppointmentId,
        serviceId: appointment.serviceId,
        dateKey: appointment.dateKey,
        time: appointment.time,
        ...(additionalDepositCents > 0 ? {
          additionalDeposit: buildDepositInput(
            payment,
            additionalDepositCents
          )
        } : {})
      }
    };
  }

  // Normaliza el correo opcional
  const normalizedEmail = activeClient.email.trim();

  // Construye una reserva independiente
  return {
    type: 'create',
    request: {
      client: {
        ...(activeClient.id ? { id: activeClient.id } : {}),
        fullName: activeClient.fullName.trim(),
        phone: activeClient.phone,
        ...(normalizedEmail ? { email: normalizedEmail } : {})
      },
      contactChannel: normalizedEmail ? 'correo' : 'llamada',
      serviceId: appointment.serviceId,
      dateKey: appointment.dateKey,
      time: appointment.time,
      deposit: buildDepositInput(payment, requiredDepositCents)
    }
  };
};
