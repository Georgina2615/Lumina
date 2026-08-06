// Construye la solicitud pendiente de revision
export const buildPublicRequestDocument = ({
  client,
  contactKey,
  depositAmountCents,
  interval,
  paymentReference,
  proofPath,
  requestId,
  service,
  timestamp,
  toTimestamp
}) => ({
  schemaVersion: 1,
  status: 'pending_review',
  client: {
    fullName: client.fullName,
    phone: client.phone,
    email: client.email
  },
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
  proof: {
    path: proofPath,
    contentType: 'image/webp',
    paymentReference
  },
  requestId,
  createdAt: timestamp,
  updatedAt: timestamp
});

// Construye el bloqueo temporal del horario
export const buildPublicReservationDocument = ({
  interval,
  requestId,
  timestamp,
  toTimestamp
}) => ({
  schemaVersion: 1,
  status: 'pending_review',
  requestId,
  dateKey: interval.dateKey,
  time: interval.time,
  start: toTimestamp(interval.start),
  blockEnd: toTimestamp(interval.blockEnd),
  createdAt: timestamp
});

// Construye el bloqueo privado del contacto
export const buildPublicContactLockDocument = ({ requestId, timestamp }) => ({
  schemaVersion: 1,
  active: true,
  requestId,
  createdAt: timestamp
});
