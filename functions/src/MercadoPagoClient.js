import { AppointmentError } from './AppointmentError.js';

const API_URL = 'https://api.mercadopago.com';

// Convierte respuestas externas en fallos seguros
const requestMercadoPago = async ({ accessToken, body, method, path }) => {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    throw new AppointmentError(
      'unavailable',
      'Mercado Pago no pudo preparar el cobro'
    );
  }

  return response.json();
};

// Crea una preferencia con importe calculado por el servidor
export const createMercadoPagoPreference = ({
  accessToken,
  depositAmountCents,
  expiresAt,
  notificationUrl,
  returnUrl,
  service,
  sessionId
}) => requestMercadoPago({
  accessToken,
  method: 'POST',
  path: '/checkout/preferences',
  body: {
    items: [{
      id: service.id,
      title: `Anticipo ${service.name}`,
      quantity: 1,
      currency_id: 'MXN',
      unit_price: depositAmountCents / 100
    }],
    external_reference: sessionId,
    metadata: { public_payment_session_id: sessionId },
    back_urls: {
      success: returnUrl,
      pending: returnUrl,
      failure: returnUrl
    },
    auto_return: 'approved',
    notification_url: notificationUrl,
    expires: true,
    expiration_date_to: expiresAt.toISOString(),
    payment_methods: {
      excluded_payment_types: [{ id: 'ticket' }, { id: 'atm' }]
    }
  }
});

// Consulta el pago directamente con el proveedor
export const getMercadoPagoPayment = ({ accessToken, paymentId }) => (
  requestMercadoPago({
    accessToken,
    method: 'GET',
    path: `/v1/payments/${encodeURIComponent(paymentId)}`
  })
);
