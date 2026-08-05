// Convierte un consentimiento real para consulta histórica
export const mapClinicalConsent = (id, data) => {
  if (
    typeof id !== 'string'
    || data?.appointmentId !== id
    || typeof data?.clientId !== 'string'
    || data?.status !== 'signed'
    || data?.schemaVersion !== 1
  ) return null;

  return {
    appointmentDate: String(data.appointmentDate ?? ''),
    appointmentId: id,
    clientId: data.clientId,
    clinicalPhotosAllowed: data.clinicalPhotosAllowed === true,
    marketingPhotosAllowed: data.marketingPhotosAllowed === true,
    serviceName: String(data.serviceNameSnapshot ?? ''),
    signaturePath: String(data.signaturePath ?? ''),
    signedAt: data.signedAt ?? null,
    templateVersion: Number(data.templateVersion ?? 0)
  };
};

// Ordena los consentimientos desde el más reciente
export const sortClinicalConsents = (consents) => [...consents].sort(
  (first, second) => second.appointmentDate.localeCompare(first.appointmentDate)
);
