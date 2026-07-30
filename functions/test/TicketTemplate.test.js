import assert from 'node:assert/strict';
import test from 'node:test';
import { buildTicketTemplateParameters } from '../src/TicketTemplate.js';

// Construye una venta canónica para el ticket
const buildSale = (overrides = {}) => ({
  estado: 'pagada',
  folio: 'LS-ABC123',
  tipo: 'cita',
  clienteNombre: 'Cliente Real',
  clienteEmail: 'cliente@example.com',
  creadaEn: new Date('2026-07-29T20:30:00.000Z'),
  items: [{
    nombre: 'Limpieza facial profunda',
    cantidad: 1,
    precioUnitarioCentavos: 45_000,
    totalCentavos: 45_000
  }],
  desglose: {
    subtotalCentavos: 38_793,
    ivaIncluidoCentavos: 6_207,
    totalCentavos: 45_000,
    anticipoAplicadoCentavos: 13_500,
    saldoCobradoCentavos: 31_500
  },
  metodosPago: ['efectivo', 'transferencia'],
  ...overrides
});

test('construye variables localizadas para EmailJS', () => {
  // Construye las variables del comprobante
  const parameters = buildTicketTemplateParameters(buildSale());

  assert.equal(parameters.to_email, 'cliente@example.com');
  assert.equal(parameters.folio, 'LS-ABC123');
  assert.equal(parameters.sale_type, 'Cita');
  assert.match(parameters.sale_date, /29 de julio de 2026/);
  assert.equal(parameters.subtotal, '$387.93');
  assert.equal(parameters.tax, '$62.07');
  assert.equal(parameters.iva, '$62.07');
  assert.equal(parameters.deposit, '$135.00');
  assert.equal(parameters.paid_now, '$315.00');
  assert.equal(parameters.total, '$450.00');
  assert.equal(parameters.payment_methods, 'Efectivo + Transferencia');
  assert.equal(parameters.business_name, 'Lumina Skin');
  assert.equal(parameters.business_email, 'luminask01@gmail.com');
  assert.equal(parameters.business_phone, '981 101 7687');
  assert.equal(
    parameters.business_address,
    'Avenida Adolfo López Mateos 426, Campeche, Campeche'
  );
  assert.deepEqual(parameters.items[0], {
    name: 'Limpieza facial profunda',
    quantity: 1,
    unit_price: '$450.00',
    line_total: '$450.00'
  });
});

test('distingue una venta de mostrador', () => {
  // Construye las variables de mostrador
  const parameters = buildTicketTemplateParameters(buildSale({
    tipo: 'mostrador',
    clienteNombre: 'Mostrador',
    desglose: {
      subtotalCentavos: 8_621,
      ivaIncluidoCentavos: 1_379,
      totalCentavos: 10_000,
      anticipoAplicadoCentavos: 0,
      saldoCobradoCentavos: 10_000
    }
  }));

  assert.equal(parameters.sale_type, 'Venta de mostrador');
  assert.equal(parameters.deposit, '$0.00');
});

test('rechaza partidas e importes inválidos', () => {
  assert.throws(
    () => buildTicketTemplateParameters(buildSale({
      items: [{
        nombre: 'Producto',
        cantidad: 0,
        precioUnitarioCentavos: 10_000,
        totalCentavos: 10_000
      }]
    })),
    /partida/
  );

  assert.throws(
    () => buildTicketTemplateParameters(buildSale({
      desglose: {
        subtotalCentavos: -1,
        ivaIncluidoCentavos: 0,
        totalCentavos: 0,
        anticipoAplicadoCentavos: 0,
        saldoCobradoCentavos: 0
      }
    })),
    /subtotal/
  );

  assert.throws(
    () => buildTicketTemplateParameters(buildSale({
      clienteEmail: 'correo-incompleto'
    })),
    /correo/
  );
});
