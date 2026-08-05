// Calcula los valores finales del corte
export const buildCashCloseValues = ({ paymentSummary, request }) => {
  const expectedCashCents = request.openingCashCents
    + paymentSummary.methodTotals.efectivo
    - request.withdrawalsCents;

  if (expectedCashCents < 0) {
    throw new Error('Los retiros superan el efectivo disponible');
  }

  return {
    dineroInicialCentavos: request.openingCashCents,
    retirosCentavos: request.withdrawalsCents,
    efectivoContadoCentavos: request.countedCashCents,
    efectivoEsperadoCentavos: expectedCashCents,
    diferenciaEfectivoCentavos: request.countedCashCents - expectedCashCents,
    cobrosPorMetodoCentavos: paymentSummary.methodTotals,
    totalCobradoCentavos: paymentSummary.totalCents,
    cantidadCobros: paymentSummary.paymentCount,
    huellaCobros: paymentSummary.paymentFingerprint
  };
};

// Construye la respuesta visible para la pantalla
export const buildCashCloseResponse = ({ dateKey, revision, values }) => ({
  dateKey,
  revision,
  ...values
});

// Construye el documento principal del corte
export const buildCashCloseDocument = ({
  actorUid,
  dateKey,
  revision,
  timestamp,
  values
}) => ({
  fecha: dateKey,
  ...values,
  revision,
  creadoEn: timestamp,
  creadoPor: actorUid,
  actualizadoEn: timestamp,
  actualizadoPor: actorUid,
  schemaVersion: 1
});

// Construye el historial de un cambio
export const buildCashCloseChangeDocument = ({
  actorUid,
  previousValues,
  request,
  requestHash,
  response,
  timestamp
}) => ({
  accion: request.action,
  fecha: request.dateKey,
  motivo: request.reason ?? null,
  valoresAnteriores: previousValues,
  valoresNuevos: response,
  actorUid,
  registradaEn: timestamp,
  idempotencia: { hashSolicitud: requestHash },
  resultado: response,
  schemaVersion: 1
});
