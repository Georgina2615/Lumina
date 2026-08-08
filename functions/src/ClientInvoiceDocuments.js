// Construye la solicitud privada de facturación
export const buildClientInvoiceRequest = ({
  clientId,
  request,
  sale,
  timestamp
}) => ({
  ventaId: request.saleId,
  citaId: sale.citaId ?? null,
  clienteId: clientId,
  folioVenta: sale.folio.trim(),
  totalVentaCentavos: sale.desglose.totalCentavos,
  datosFiscales: {
    rfc: request.taxId,
    nombreFiscal: request.taxpayerName,
    codigoPostal: request.postalCode,
    regimenFiscal: request.taxRegime,
    usoCfdi: request.invoiceUse,
    correoEntrega: request.deliveryEmail
  },
  estado: 'pendiente',
  revision: 0,
  solicitadaEn: timestamp,
  actualizadaEn: timestamp,
  procesadaEn: null,
  procesadaPor: null,
  folioFiscal: '',
  motivo: '',
  schemaVersion: 1
});
