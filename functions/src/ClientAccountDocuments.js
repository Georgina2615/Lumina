const visibleStates = new Set([
  'por_confirmar',
  'confirmada',
  'en_cabina',
  'por_cobrar',
  'finalizada',
  'cancelada',
  'no_asistio'
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

// Construye el perfil mínimo del portal
export const buildVisibleClient = ({ clientId, data, email }) => ({
  id: clientId,
  name: data.nombreCompleto.trim(),
  email,
  phone: typeof data.telefono === 'string' ? data.telefono.trim() : ''
});
