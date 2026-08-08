const visibleStates = new Set([
  'por_confirmar',
  'confirmada',
  'en_cabina',
  'por_cobrar',
  'finalizada',
  'cancelada',
  'no_asistio'
]);
const visibleInvoiceStates = new Set([
  'pendiente',
  'en_preparacion',
  'enviada',
  'rechazada'
]);

// Convierte una fecha segura en texto
const toIsoDate = (value) => {
  if (typeof value?.toDate === 'function') {
    return value.toDate().toISOString();
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }
  return null;
};

// Oculta cualquier dato operativo o clínico
export const buildVisibleAppointment = (snapshot) => {
  const data = snapshot.data();
  const status = visibleStates.has(data.estado)
    ? data.estado
    : 'por_confirmar';
  return {
    id: snapshot.id,
    serviceName: String(data.servicio ?? '').trim(),
    date: String(data.fecha ?? '').trim(),
    time: String(data.hora ?? '').trim(),
    startAt: toIsoDate(data.inicio),
    status,
    depositPaid: data.anticipoPagado === true,
    depositAmountCents: Number.isInteger(data.anticipoMontoCentavos)
      ? Math.max(0, data.anticipoMontoCentavos)
      : 0,
    cancellationOrigin: status === 'cancelada'
      ? String(data.cancelacion?.origen ?? '')
      : '',
    cancellationReason: status === 'cancelada'
      ? String(data.cancelacion?.motivo ?? '').slice(0, 500)
      : ''
  };
};

// Ordena las citas desde la más reciente
export const sortVisibleAppointments = (appointments) => (
  [...appointments].sort((first, second) => {
    const firstValue = first.startAt ?? `${first.date}T${first.time}`;
    const secondValue = second.startAt ?? `${second.date}T${second.time}`;
    return secondValue.localeCompare(firstValue);
  })
);

// Resume el estado de facturación sin revelar datos fiscales
export const buildInvoiceStatusMap = (snapshots) => new Map(
  snapshots.map((snapshot) => {
    const data = snapshot.data();
    return [
      data.ventaId,
      data.schemaVersion === 1 && visibleInvoiceStates.has(data.estado)
        ? data.estado
        : null
    ];
  }).filter(([saleId, status]) => (
    typeof saleId === 'string' && saleId && status
  ))
);

// Convierte una venta pagada en información segura
export const buildVisibleSale = (snapshot, invoiceStatuses = new Map()) => {
  const data = snapshot.data();
  const totalAmountCents = data.desglose?.totalCentavos;
  const createdAt = toIsoDate(data.creadaEn);

  if (
    data.schemaVersion !== 1
    || data.estado !== 'pagada'
    || !['cita', 'mostrador'].includes(data.tipo)
    || !Number.isSafeInteger(totalAmountCents)
    || totalAmountCents <= 0
    || typeof data.folio !== 'string'
    || !data.folio.trim()
    || !createdAt
  ) {
    return null;
  }

  return {
    id: snapshot.id,
    folio: data.folio.trim(),
    createdAt,
    saleType: data.tipo === 'mostrador' ? 'mostrador' : 'cita',
    totalAmountCents,
    invoiceStatus: invoiceStatuses.get(snapshot.id) ?? null
  };
};

// Ordena las ventas desde la más reciente
export const sortVisibleSales = (sales) => (
  [...sales].sort((first, second) => (
    String(second.createdAt ?? '').localeCompare(String(first.createdAt ?? ''))
  ))
);

// Construye el perfil mínimo del portal
export const buildVisibleClient = ({ clientId, data, email }) => ({
  id: clientId,
  name: data.nombreCompleto.trim(),
  email,
  phone: typeof data.telefono === 'string' ? data.telefono.trim() : ''
});
