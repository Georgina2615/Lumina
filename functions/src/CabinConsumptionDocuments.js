// Construye un movimiento de consumo vinculado con la cita
export const buildCabinConsumptionMovement = ({
  actorUid,
  appointmentId,
  clientId,
  nextInventoryValueCents,
  nextStockScaled,
  previousInventoryValueCents,
  supply,
  quantityScaled,
  timestamp
}) => ({
  accion: 'consumo_cabina',
  actorUid,
  cantidadEscalada: quantityScaled,
  cambioExistenciasEscalado: -quantityScaled,
  citaId: appointmentId,
  clienteId: clientId,
  costoTotalCentavos: null,
  existenciasAnterioresEscaladas: supply.stockScaled,
  existenciasPosterioresEscaladas: nextStockScaled,
  fecha: timestamp,
  insumoId: supply.id,
  insumoNombre: supply.name,
  motivo: 'Uso durante tratamiento estético',
  referencia: appointmentId,
  schemaVersion: 1,
  sucursalId: 'principal',
  tipo: 'salida_servicio',
  unidad: supply.unit,
  valorInventarioAnteriorCentavos: previousInventoryValueCents,
  valorInventarioPosteriorCentavos: nextInventoryValueCents,
  valorRetiradoCentavos: previousInventoryValueCents - nextInventoryValueCents
});

// Construye el registro inmutable del consumo
export const buildCabinConsumptionDocument = ({
  actorUid,
  appointment,
  request,
  requestHash,
  response,
  timestamp,
  usedItems
}) => ({
  appointmentDate: String(appointment.fecha ?? ''),
  appointmentId: request.appointmentId,
  clientId: request.clientId,
  items: usedItems,
  lastOperation: {
    id: request.operationId,
    requestHash,
    result: response
  },
  recordedAt: timestamp,
  recordedBy: actorUid,
  schemaVersion: 1,
  serviceName: String(appointment.servicio ?? ''),
  status: 'recorded'
});
