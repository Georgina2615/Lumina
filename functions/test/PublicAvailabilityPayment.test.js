import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isActivePublicReservation
} from '../src/GetPublicAvailability.js';

const now = new Date('2030-07-01T12:00:00.000Z');

// Conserva solicitudes manuales heredadas
test('mantiene ocupada una solicitud pendiente de revisión', () => {
  assert.equal(isActivePublicReservation({
    status: 'pending_review'
  }, now), true);
});

// Mantiene el horario mientras el pago puede completarse
test('mantiene una reserva de pago vigente', () => {
  assert.equal(isActivePublicReservation({
    status: 'pending_payment',
    expiresAt: new Date('2030-07-01T12:20:00.000Z')
  }, now), true);
});

// Libera una reserva de pago vencida
test('libera una reserva de pago vencida', () => {
  assert.equal(isActivePublicReservation({
    status: 'pending_payment',
    expiresAt: new Date('2030-07-01T11:59:59.000Z')
  }, now), false);
});
