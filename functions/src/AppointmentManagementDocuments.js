import {
  NO_SHOW_TOLERANCE_MINUTES
} from './AppointmentManagementStatePolicy.js';

// Calcula el destino financiero del anticipo
const resolveDepositResult = (appointment, request) => {
  // Detecta un anticipo vigente
  const hasDeposit = appointment.anticipoPagado === true
    && Number.isSafeInteger(appointment.anticipoMontoCentavos)
    && appointment.anticipoMontoCentavos > 0;

  // Conserva el anticipo cuando no hay pago
  if (!hasDeposit) {
    return 'no_aplica';
  }

  // Habilita el saldo cuando cancela la clinica
  if (request.action === 'cancelar' && request.origin === 'clinica') {
    return 'disponible_reprogramacion';
  }

  // Retiene el anticipo en los demás casos terminales
  return 'retenido';
};

// Construye el seguimiento de la confirmacion
const buildConfirmationTracking = ({
  actorUid,
  appointment,
  request,
  timestamp
}) => ({
  ...appointment.contactoConfirmacion,
  canal: appointment.contactoConfirmacion?.canal ?? request.channel,
  estado: 'confirmada',
  requiereLlamada: false,
  solicitudEnviada: appointment.contactoConfirmacion
    ?.solicitudEnviada === true,
  confirmadaEn: timestamp,
  confirmadaPor: actorUid,
  confirmadaMediante: request.channel
});

// Construye los cambios de la cita
export const buildManagementUpdate = ({
  actorUid,
  appointment,
  request,
  timestamp
}) => {
  // Construye las propiedades compartidas
  const update = {
    estado: request.status,
    actualizadaEn: timestamp,
    actualizadaPor: actorUid
  };

  // Conserva la confirmacion operativa
  if (request.action === 'confirmar') {
    return {
      ...update,
      confirmacion: {
        canal: request.channel,
        origen: 'recepcion',
        fecha: timestamp,
        actorUid
      },
      contactoConfirmacion: buildConfirmationTracking({
        actorUid,
        appointment,
        request,
        timestamp
      })
    };
  }

  // Obtiene el resultado financiero terminal
  const depositResult = resolveDepositResult(appointment, request);

  // Conserva la cancelacion y la opcion de reprogramar
  if (request.action === 'cancelar') {
    const canReschedule = depositResult === 'disponible_reprogramacion';

    return {
      ...update,
      cancelacion: {
        origen: request.origin,
        motivo: request.reason,
        fecha: timestamp,
        actorUid,
        anticipoResultado: depositResult,
        reprogramacionDisponible: canReschedule
      },
      ...(canReschedule ? {
        reprogramacion: {
          estado: 'disponible',
          anticipoDisponibleCentavos:
            appointment.anticipoMontoCentavos,
          habilitadaEn: timestamp,
          habilitadaPor: actorUid
        }
      } : {})
    };
  }

  // Conserva la inasistencia auditada
  if (request.action === 'marcar_no_asistio') {
    return {
      ...update,
      inasistencia: {
        motivo: request.reason,
        fecha: timestamp,
        actorUid,
        toleranciaMinutos: NO_SHOW_TOLERANCE_MINUTES,
        anticipoResultado: depositResult
      }
    };
  }

  // Devuelve una transicion operativa simple
  return update;
};

// Construye el evento inmutable
export const buildManagementEvent = ({
  actorUid,
  previousStatus,
  request,
  timestamp,
  update
}) => ({
  tipo: 'cambio_estado',
  accion: request.action,
  estadoAnterior: previousStatus,
  estadoNuevo: request.status,
  canal: request.channel,
  origen: request.origin,
  motivo: request.reason,
  actorUid,
  fecha: timestamp,
  anticipoResultado: update.cancelacion?.anticipoResultado
    ?? update.inasistencia?.anticipoResultado
    ?? null
});
