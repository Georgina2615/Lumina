// Define los datos públicos del negocio
const BUSINESS = Object.freeze({
  name: 'Lumina Skin',
  email: 'luminask01@gmail.com',
  phone: '981 101 7687',
  address: 'Avenida Adolfo López Mateos 426, Campeche, Campeche'
});

// Define la zona horaria operativa
const BUSINESS_TIME_ZONE = 'America/Mexico_City';

// Configura el formato monetario mexicano
const currencyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2
});

// Configura el formato local de fecha
const dateFormatter = new Intl.DateTimeFormat('es-MX', {
  dateStyle: 'long',
  timeStyle: 'short',
  timeZone: BUSINESS_TIME_ZONE
});

// Define las etiquetas de pago
const paymentLabels = Object.freeze({
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia'
});

// Verifica enteros monetarios no negativos
const requireCents = (value, label) => {
  // Detiene importes inválidos
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${label} no es válido`);
  }

  // Devuelve el importe comprobado
  return value;
};

// Convierte centavos a moneda visible
const formatCurrency = (value, label) => (
  currencyFormatter.format(requireCents(value, label) / 100)
);

// Limpia texto requerido del comprobante
const requireText = (value, label) => {
  // Normaliza el valor recibido
  const normalized = typeof value === 'string' ? value.trim() : '';

  // Detiene texto ausente
  if (!normalized) {
    throw new Error(`${label} no está disponible`);
  }

  // Devuelve texto comprobado
  return normalized;
};

// Valida el destinatario persistido
const requireRecipientEmail = (value) => {
  // Limpia y normaliza el correo
  const normalized = requireText(
    value,
    'El correo del comprobante'
  ).toLowerCase();

  // Separa el dominio del destinatario
  const separatorIndex = normalized.lastIndexOf('@');

  // Detiene correos incompletos
  if (
    normalized.length > 254
    || separatorIndex < 1
    || separatorIndex > 64
    || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)
  ) {
    throw new Error('El correo del comprobante no es válido');
  }

  // Devuelve el destinatario comprobado
  return normalized;
};

// Convierte la marca temporal de Firestore
const resolveSaleDate = (value) => {
  // Convierte marcas temporales canónicas
  const date = typeof value?.toDate === 'function'
    ? value.toDate()
    : value instanceof Date
      ? value
      : new Date(value);

  // Detiene fechas inválidas
  if (Number.isNaN(date.getTime())) {
    throw new Error('La fecha de venta no está disponible');
  }

  // Devuelve la fecha local del negocio
  return dateFormatter.format(date);
};

// Convierte un método a su etiqueta pública
const formatPaymentMethod = (method) => (
  paymentLabels[method] ?? 'Otro'
);

// Construye una línea segura del ticket
const buildTemplateItem = (item) => {
  // Valida la cantidad vendida
  if (!Number.isSafeInteger(item?.cantidad) || item.cantidad < 1) {
    throw new Error('Una partida del ticket no es válida');
  }

  // Devuelve la partida compatible con EmailJS
  return {
    name: requireText(item.nombre, 'El nombre de la partida'),
    quantity: item.cantidad,
    unit_price: formatCurrency(
      item.precioUnitarioCentavos,
      'El precio unitario'
    ),
    line_total: formatCurrency(item.totalCentavos, 'El total de la partida')
  };
};

// Construye las variables canónicas de EmailJS
export const buildTicketTemplateParameters = (sale) => {
  // Detiene ventas fuera del contrato
  if (
    !sale
    || sale.estado !== 'pagada'
    || !['cita', 'mostrador'].includes(sale.tipo)
    || !Array.isArray(sale.items)
    || sale.items.length === 0
    || !sale.desglose
  ) {
    throw new Error('La venta no tiene información válida para el ticket');
  }

  // Normaliza el destinatario persistido
  const recipientEmail = requireRecipientEmail(sale.clienteEmail);

  // Construye las partidas congeladas
  const items = sale.items.map(buildTemplateItem);

  // Obtiene el desglose persistido
  const breakdown = sale.desglose;

  // Convierte los métodos registrados
  const paymentMethods = Array.isArray(sale.metodosPago)
    ? sale.metodosPago.map(formatPaymentMethod).join(' + ')
    : '';

  // Devuelve solo variables permitidas
  return {
    to_email: recipientEmail,
    folio: requireText(sale.folio, 'El folio'),
    client_name: requireText(sale.clienteNombre, 'El nombre del cliente'),
    sale_date: resolveSaleDate(sale.creadaEn),
    sale_type: sale.tipo === 'cita' ? 'Cita' : 'Venta de mostrador',
    items,
    subtotal: formatCurrency(breakdown.subtotalCentavos, 'El subtotal'),
    tax: formatCurrency(breakdown.ivaIncluidoCentavos, 'El IVA'),
    iva: formatCurrency(breakdown.ivaIncluidoCentavos, 'El IVA'),
    deposit: formatCurrency(
      breakdown.anticipoAplicadoCentavos,
      'El anticipo'
    ),
    paid_now: formatCurrency(
      breakdown.saldoCobradoCentavos,
      'El pago actual'
    ),
    total: formatCurrency(breakdown.totalCentavos, 'El total'),
    payment_methods: paymentMethods || 'No disponible',
    business_name: BUSINESS.name,
    business_email: BUSINESS.email,
    business_phone: BUSINESS.phone,
    business_address: BUSINESS.address
  };
};
