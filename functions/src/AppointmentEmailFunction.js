import { logger } from 'firebase-functions';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { sendEmailJsTemplate } from './EmailJsTransport.js';
import {
  sendAppointmentEmailHandler
} from './SendAppointmentEmail.js';

// Crea el transporte con la plantilla de citas
const createAppointmentEmailSender = ({
  appointmentTemplateId,
  emailJsConfig
}) => ({ templateParameters }) => {
  const config = emailJsConfig.value();
  return sendEmailJsTemplate({
    config: {
      ...config,
      templateId: appointmentTemplateId.value()
    },
    templateParameters
  });
};

// Expone el envío automático de citas
export const createAppointmentEmailFunction = ({
  appointmentTemplateId,
  emailJsConfig,
  enableEmulatorEmail,
  firestore,
  isEmulator,
  runtimeOptions
}) => onDocumentCreated({
  ...runtimeOptions,
  document: 'citas/{appointmentId}',
  secrets: [emailJsConfig, appointmentTemplateId],
  retry: true
}, async (event) => {
  if (isEmulator && !enableEmulatorEmail) {
    return { status: 'omitido_en_emulador', sent: false };
  }

  const result = await sendAppointmentEmailHandler({
    appointmentId: event.params.appointmentId,
    attemptId: event.id,
    firestore: firestore(),
    sendEmail: createAppointmentEmailSender({
      appointmentTemplateId,
      emailJsConfig
    })
  });
  if (['fallido', 'no_confirmado'].includes(result.status)) {
    logger.error('No se pudo enviar el correo de la cita', {
      appointmentId: event.params.appointmentId,
      status: result.status
    });
  }
  return result;
});
