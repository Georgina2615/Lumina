import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildDepositInput,
  createPaymentPart,
  syncCashReceived
} from '../src/modules/reception/services/PaymentPolicy.js';

// Verifica el efectivo inicial igual al importe aplicado
test('autocompleta el efectivo recibido sin generar cambio', () => {
  // Crea una parte de efectivo por treinta y cinco pesos
  const payment = createPaymentPart('efectivo', 3500);

  // Confirma el importe visible inicial
  assert.equal(payment.cashReceived, '35');

  // Construye un anticipo simple válido
  const deposit = buildDepositInput({
    method: 'efectivo',
    primary: payment
  }, 3500);

  // Confirma que no existe cambio
  assert.equal(deposit.payments[0].cashReceivedCents, 3500);
  assert.equal(deposit.payments[0].changeCents, 0);
});

// Verifica la conservación de una captura manual
test('conserva el efectivo recibido cuando ya fue editado', () => {
  // Representa una captura manual de cien pesos
  const payment = {
    ...createPaymentPart('efectivo', 3500),
    cashReceived: '100',
    cashReceivedEdited: true
  };

  // Intenta sincronizar un nuevo importe aplicado
  const synchronized = syncCashReceived(payment, 4000);

  // Conserva la decisión de la recepcionista
  assert.equal(synchronized.cashReceived, '100');
});

// Verifica la autorización obligatoria de tarjeta
test('exige folio o autorización para un pago con tarjeta', () => {
  // Crea una tarjeta sin evidencia
  const payment = {
    method: 'tarjeta',
    primary: createPaymentPart('tarjeta')
  };

  // Confirma el rechazo de la evidencia incompleta
  assert.throws(
    () => buildDepositInput(payment, 13500),
    /folio o autorización/
  );
});

// Verifica la evidencia aceptada de tarjeta
test('acepta autorización y últimos cuatro opcionales de tarjeta', () => {
  // Captura únicamente datos permitidos de la terminal
  const payment = {
    method: 'tarjeta',
    primary: {
      ...createPaymentPart('tarjeta'),
      reference: 'AUT 482731',
      cardLastFour: '9042'
    }
  };

  // Construye el anticipo confirmado
  const deposit = buildDepositInput(payment, 13500);

  // Conserva la evidencia permitida
  assert.equal(deposit.payments[0].reference, 'AUT 482731');
  assert.equal(deposit.payments[0].cardLastFour, '9042');
});

// Verifica la clave obligatoria de transferencia
test('exige clave de rastreo o referencia SPEI', () => {
  // Crea una transferencia sin comprobante
  const payment = {
    method: 'transferencia',
    primary: createPaymentPart('transferencia')
  };

  // Confirma el rechazo de la evidencia incompleta
  assert.throws(
    () => buildDepositInput(payment, 13500),
    /clave de rastreo o referencia SPEI/
  );
});

// Verifica el desglose mixto sin cambio artificial
test('registra treinta y cinco en efectivo y cien en tarjeta', () => {
  // Sincroniza el efectivo con su importe aplicado
  const cashPart = syncCashReceived({
    ...createPaymentPart('efectivo'),
    amount: '35'
  }, 3500);

  // Construye el pago mixto completo
  const deposit = buildDepositInput({
    method: 'mixto',
    primary: cashPart,
    secondary: {
      ...createPaymentPart('tarjeta'),
      reference: 'AUT 123456'
    }
  }, 13500);

  // Confirma el desglose exacto
  assert.equal(deposit.payments[0].amountCents, 3500);
  assert.equal(deposit.payments[0].cashReceivedCents, 3500);
  assert.equal(deposit.payments[0].changeCents, 0);
  assert.equal(deposit.payments[1].amountCents, 10000);
});
