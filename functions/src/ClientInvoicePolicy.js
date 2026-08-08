import { HttpsError } from 'firebase-functions/v2/https';

const allowedRegimes = new Set([
  '601', '603', '605', '606', '607', '608', '610', '611', '612', '614',
  '615', '616', '621', '625', '626'
]);
const allowedUses = new Set([
  'G01', 'G02', 'G03', 'S01', 'CP01', 'CN01', 'D01', 'D02', 'D03', 'D04',
  'D05', 'D06', 'D07', 'D08', 'D09', 'D10'
]);
const saleIdPattern = /^[A-Za-z0-9_-]{1,150}$/;
const taxIdPattern = /^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/;
const emailPattern = /^[^/@\s]+@[^/@\s]+\.[^/@\s]+$/;

// Normaliza texto fiscal sin modificar su contenido
const normalizeText = (value, maximumLength) => {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (
    normalized.length < 2
    || normalized.length > maximumLength
    || normalized.includes('<')
    || normalized.includes('>')
    || [...normalized].some((character) => character.charCodeAt(0) < 32)
  ) {
    throw new HttpsError('invalid-argument', 'Revisa los datos fiscales');
  }
  return normalized;
};

// Valida una solicitud fiscal enviada por la clienta
export const validateClientInvoiceRequest = (data) => {
  const source = data && typeof data === 'object' && !Array.isArray(data)
    ? data
    : {};
  const saleId = typeof source.saleId === 'string' ? source.saleId.trim() : '';
  const taxId = typeof source.taxId === 'string'
    ? source.taxId.trim().toUpperCase()
    : '';
  const postalCode = typeof source.postalCode === 'string'
    ? source.postalCode.trim()
    : '';
  const taxRegime = String(source.taxRegime ?? '').trim();
  const invoiceUse = String(source.invoiceUse ?? '').trim().toUpperCase();
  const deliveryEmail = typeof source.deliveryEmail === 'string'
    ? source.deliveryEmail.trim().toLowerCase()
    : '';

  if (!saleIdPattern.test(saleId) || !taxIdPattern.test(taxId)) {
    throw new HttpsError('invalid-argument', 'Revisa el RFC y la venta');
  }
  if (!/^\d{5}$/.test(postalCode) || !allowedRegimes.has(taxRegime)) {
    throw new HttpsError('invalid-argument', 'Revisa el código postal y el régimen fiscal');
  }
  if (!allowedUses.has(invoiceUse) || !emailPattern.test(deliveryEmail)) {
    throw new HttpsError('invalid-argument', 'Revisa el uso de factura y el correo');
  }

  return {
    deliveryEmail,
    invoiceUse,
    postalCode,
    saleId,
    taxId,
    taxpayerName: normalizeText(source.taxpayerName, 200),
    taxRegime
  };
};

// Exige una venta pagada de la misma clienta
export const requireInvoiceSale = (snapshot, clientId) => {
  const sale = snapshot?.exists ? snapshot.data() : null;
  if (
    sale?.schemaVersion !== 1
    || sale.estado !== 'pagada'
    || sale.clienteId !== clientId
    || !Number.isSafeInteger(sale.desglose?.totalCentavos)
    || sale.desglose.totalCentavos <= 0
    || typeof sale.folio !== 'string'
    || !sale.folio.trim()
  ) {
    throw new HttpsError('failed-precondition', 'La venta todavía no puede facturarse');
  }
  return sale;
};
