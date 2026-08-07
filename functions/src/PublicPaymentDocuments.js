// Construye la sesión privada que espera el pago
export const buildPublicPaymentSessionDocument = ({
  accessKeyHash,
  client,
  contactKey,
  depositAmountCents,
  interval,
  reservationExpiresAt,
  service,
  sessionId,
  slotId,
  timestamp,
  toTimestamp
}) => ({
  schemaVersion: 1,
  status: 'pending_payment',
  sessionId,
  accessKeyHash,
  client,
  contactKey,
  service: {
    id: service.id,
    name: service.name,
    priceCents: service.priceCents,
    depositPercentage: service.depositPercentage,
    depositAmountCents
  },
  schedule: {
    dateKey: interval.dateKey,
    time: interval.time,
    start: toTimestamp(interval.start),
    treatmentEnd: toTimestamp(interval.treatmentEnd),
    blockEnd: toTimestamp(interval.blockEnd)
  },
  slotId,
  reservationExpiresAt: toTimestamp(reservationExpiresAt),
  createdAt: timestamp,
  updatedAt: timestamp
});

// Construye el bloqueo temporal del cobro
export const buildPublicPaymentReservationDocument = ({
  expiresAt,
  interval,
  sessionId,
  timestamp,
  toTimestamp
}) => ({
  schemaVersion: 2,
  status: 'pending_payment',
  sessionId,
  dateKey: interval.dateKey,
  time: interval.time,
  start: toTimestamp(interval.start),
  blockEnd: toTimestamp(interval.blockEnd),
  expiresAt: toTimestamp(expiresAt),
  createdAt: timestamp
});

// Construye el bloqueo temporal del contacto
export const buildPublicPaymentContactLock = ({
  expiresAt,
  sessionId,
  timestamp,
  toTimestamp
}) => ({
  schemaVersion: 2,
  active: true,
  sessionId,
  expiresAt: toTimestamp(expiresAt),
  createdAt: timestamp
});
