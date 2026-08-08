// Convierte fechas del servidor en texto seguro
export const mapAdminInvoiceDate = (value) => {
  const date = typeof value?.toDate === 'function' ? value.toDate() : value;
  return date instanceof Date && Number.isFinite(date.getTime())
    ? date.toISOString()
    : null;
};

// Presenta únicamente solicitudes válidas a administración
export const mapAdminInvoiceDocument = (snapshot) => {
  const data = snapshot.data();
  const fiscal = data?.datosFiscales;
  if (
    data?.schemaVersion !== 1
    || !['pendiente', 'preparada', 'entregada'].includes(data.estado)
    || !Number.isSafeInteger(data.revision)
    || !Number.isSafeInteger(data.totalVentaCentavos)
    || !fiscal
  ) return null;

  return {
    id: snapshot.id,
    saleId: String(data.ventaId ?? ''),
    saleFolio: String(data.folioVenta ?? ''),
    totalAmountCents: data.totalVentaCentavos,
    status: data.estado,
    revision: data.revision,
    requestedAt: mapAdminInvoiceDate(data.solicitadaEn),
    updatedAt: mapAdminInvoiceDate(data.actualizadaEn),
    fiscalFolio: String(data.folioFiscal ?? ''),
    note: String(data.nota ?? ''),
    fiscalData: {
      taxId: String(fiscal.rfc ?? ''),
      taxpayerName: String(fiscal.nombreFiscal ?? ''),
      postalCode: String(fiscal.codigoPostal ?? ''),
      taxRegime: String(fiscal.regimenFiscal ?? ''),
      invoiceUse: String(fiscal.usoCfdi ?? ''),
      deliveryEmail: String(fiscal.correoEntrega ?? '')
    }
  };
};

// Construye el cambio controlado de estado
export const buildAdminInvoiceUpdate = ({ actorUid, request, status, timestamp }) => {
  const values = {
    estado: status,
    revision: request.expectedRevision + 1,
    actualizadaEn: timestamp,
    actualizadaPor: actorUid,
    nota: request.note
  };

  if (status === 'preparada') {
    return {
      ...values,
      folioFiscal: request.fiscalFolio,
      procesadaEn: timestamp,
      procesadaPor: actorUid
    };
  }

  return {
    ...values,
    entregadaEn: timestamp,
    entregadaPor: actorUid
  };
};
