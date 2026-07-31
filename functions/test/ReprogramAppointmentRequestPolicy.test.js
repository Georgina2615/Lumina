import assert from 'node:assert/strict';
import test from 'node:test';
import { AppointmentError } from '../src/AppointmentError.js';
import {
  validateReprogramRequest
} from '../src/ReprogramAppointmentRequestPolicy.js';
import {
  buildReprogramRequestData
} from './ReprogramAppointmentFixture.js';

// Define un reloj estable
const now = new Date('2026-07-30T18:00:00.000Z');

// Normaliza el contrato mínimo
test('valida una solicitud de reprogramación mínima', () => {
  const request = validateReprogramRequest(
    buildReprogramRequestData(),
    now
  );

  assert.equal(request.sourceAppointmentId, 'appointment-source');
  assert.equal(request.serviceId, 'limpieza-profunda');
  assert.equal(request.additionalDeposit, null);
});

// Rechaza propiedades fuera del contrato
test('rechaza campos desconocidos en una reprogramación', () => {
  assert.throws(
    () => validateReprogramRequest({
      ...buildReprogramRequestData(),
      clientId: 'client-forged'
    }, now),
    (error) => error instanceof AppointmentError
  );
});

// Delega la anticipación a la transacción idempotente
test('normaliza el destino aunque el horario ya haya pasado', () => {
  const request = validateReprogramRequest(
    buildReprogramRequestData(),
    new Date('2026-08-05T18:00:00.000Z')
  );

  assert.equal(request.dateKey, '2026-08-04');
});
