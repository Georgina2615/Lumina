const currencyFormatter = new Intl.NumberFormat('es-MX', {
  currency: 'MXN',
  style: 'currency'
});
const dateFormatter = new Intl.DateTimeFormat('es-MX', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'America/Mexico_City'
});

export const ADMIN_INVOICE_STATUS = {
  all: 'todas',
  delivered: 'entregada',
  pending: 'pendiente',
  prepared: 'preparada'
};

export const ADMIN_INVOICE_STATUS_LABELS = {
  pendiente: 'Pendiente',
  preparada: 'Preparada',
  entregada: 'Atendida'
};

const taxRegimeLabels = {
  601: 'General de ley personas morales',
  603: 'Personas morales con fines no lucrativos',
  605: 'Sueldos y salarios',
  606: 'Arrendamiento',
  612: 'Actividades empresariales y profesionales',
  616: 'Sin obligaciones fiscales',
  621: 'Incorporación fiscal',
  625: 'Actividades empresariales mediante plataformas',
  626: 'Régimen simplificado de confianza'
};
const invoiceUseLabels = {
  G01: 'Compra de mercancías',
  G02: 'Devoluciones descuentos o bonificaciones',
  G03: 'Gastos en general',
  S01: 'Sin efectos fiscales'
};

// Presenta importes guardados en centavos
export const formatAdminInvoiceCurrency = (cents) => (
  currencyFormatter.format((cents ?? 0) / 100)
);

// Presenta fechas con el horario de Lumina
export const formatAdminInvoiceDate = (date) => (
  date instanceof Date && Number.isFinite(date.getTime())
    ? dateFormatter.format(date)
    : 'Fecha no disponible'
);

// Explica los códigos fiscales más habituales
export const formatTaxRegime = (code) => (
  `${code} · ${taxRegimeLabels[code] ?? 'Régimen registrado'}`
);

// Explica el uso elegido por la clienta
export const formatInvoiceUse = (code) => (
  `${code} · ${invoiceUseLabels[code] ?? 'Uso registrado'}`
);

// Cuenta solicitudes por etapa
export const summarizeAdminInvoices = (requests) => requests.reduce(
  (summary, request) => ({
    ...summary,
    [request.status]: summary[request.status] + 1
  }),
  { entregada: 0, pendiente: 0, preparada: 0 }
);
