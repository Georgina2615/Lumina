import { FieldValue } from 'firebase-admin/firestore';
import { EmailJsTransportError } from './EmailJsTransport.js';
import {
  buildAppointmentEmailParameters
} from './AppointmentEmailTemplate.js';
import {
  claimAppointmentEmail,
  completeAppointmentEmail
} from './AppointmentEmailState.js';

// Convierte fallos a mensajes seguros
const mapSafeFailure = (error) => {
  if (error instanceof EmailJsTransportError) {
    const messages = {
      authorization: 'Revisa la autorización del servicio de correo',
      configuration: 'Revisa la configuración del correo de citas',
      network: 'No fue posible conectar con el servicio de correo',
      provider: 'El servicio de correo no pudo completar el envío',
      rate_limit: 'El servicio de correo alcanzó su límite temporal',
      timeout: 'El servicio de correo tardó demasiado en responder'
    };
    return {
      message: messages[error.code] ?? messages.provider,
      uncertain: ['network', 'provider', 'timeout'].includes(error.code)
    };
  }
  return {
    message: 'No fue posible preparar el correo de la cita',
    uncertain: false
  };
};

// Coordina un único envío de cita
export const sendAppointmentEmailHandler = async ({
  appointmentId,
  attemptId,
  firestore,
  sendEmail,
  serverTimestamp = () => FieldValue.serverTimestamp()
}) => {
  const claim = await claimAppointmentEmail({
    appointmentId,
    attemptId,
    firestore,
    serverTimestamp
  });

  if (claim.status === 'uncertain') {
    await completeAppointmentEmail({
      appointmentId,
      attemptId,
      errorMessage: 'Revisa EmailJS antes de repetir el envío',
      firestore,
      serverTimestamp,
      status: 'no_confirmado'
    });
    return { status: 'no_confirmado', sent: false };
  }
  if (claim.status !== 'claimed') {
    return {
      status: claim.emailStatus ?? claim.status,
      sent: false
    };
  }

  try {
    const templateParameters = buildAppointmentEmailParameters({
      appointment: claim.appointment,
      appointmentId,
      client: claim.client
    });
    await sendEmail({ templateParameters });
  } catch (error) {
    const failure = mapSafeFailure(error);
    const status = failure.uncertain ? 'no_confirmado' : 'fallido';
    await completeAppointmentEmail({
      appointmentId,
      attemptId,
      errorMessage: failure.message,
      firestore,
      serverTimestamp,
      status
    });
    return { status, sent: false };
  }

  const completion = await completeAppointmentEmail({
    appointmentId,
    attemptId,
    firestore,
    serverTimestamp,
    status: 'enviado'
  });
  return {
    status: completion.emailStatus,
    sent: completion.emailStatus === 'enviado'
  };
};
