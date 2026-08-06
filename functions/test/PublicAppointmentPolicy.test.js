import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import test from 'node:test';
import {
  PUBLIC_PROOF_MAX_BYTES,
  validatePublicAppointmentRequest,
  validatePublicAvailabilityRequest
} from '../src/PublicAppointmentPolicy.js';

// Define un reloj estable para las pruebas
const now = new Date('2030-07-01T12:00:00.000Z');

// Construye una imagen WebP minima para validar el contrato
const buildProof = (size = 120) => {
  const buffer = Buffer.alloc(size);
  buffer.write('RIFF', 0, 'ascii');
  buffer.write('WEBP', 8, 'ascii');
  return `data:image/webp;base64,${buffer.toString('base64')}`;
};

// Construye una solicitud publica valida
const buildRequest = (overrides = {}) => ({
  client: {
    fullName: 'María López',
    phone: '9811017687',
    email: 'MARIA@example.com'
  },
  serviceId: 'limpieza-facial-profunda',
  dateKey: '2030-07-01',
  time: '10:00',
  proofDataUrl: buildProof(),
  paymentReference: 'LS-WEB-A1B2C3D4',
  privacyAccepted: true,
  termsAccepted: true,
  cancellationAccepted: true,
  ...overrides
});

// Normaliza la solicitud sin conservar la imagen como texto
test('normaliza una solicitud publica valida', () => {
  const request = validatePublicAppointmentRequest(buildRequest(), now);

  assert.equal(request.client.email, 'maria@example.com');
  assert.equal(request.paymentReference, 'LS-WEB-A1B2C3D4');
  assert.equal(request.interval.start.toISOString(), '2030-07-01T16:00:00.000Z');
  assert.ok(Buffer.isBuffer(request.proof));
});

// Exige correo en el canal publico
test('rechaza una solicitud publica sin correo', () => {
  assert.throws(() => validatePublicAppointmentRequest(buildRequest({
    client: {
      fullName: 'María López',
      phone: '9811017687',
      email: ''
    }
  }), now), /correo electrónico es obligatorio/);
});

// Exige los tres documentos informativos
test('rechaza autorizaciones incompletas', () => {
  assert.throws(() => validatePublicAppointmentRequest(buildRequest({
    cancellationAccepted: false
  }), now), /Acepta los documentos informativos/);
});

// Exige dos horas completas antes de la cita
test('rechaza solicitudes con menos de dos horas', () => {
  const closeNow = new Date('2030-07-01T14:30:01.000Z');
  assert.throws(
    () => validatePublicAppointmentRequest(buildRequest(), closeNow),
    /al menos dos horas/
  );
});

// Rechaza comprobantes que exceden el limite
test('rechaza comprobantes demasiado grandes', () => {
  assert.throws(() => validatePublicAppointmentRequest(buildRequest({
    proofDataUrl: buildProof(PUBLIC_PROOF_MAX_BYTES + 1)
  }), now), /formato o tamaño válido/);
});

// Valida consultas sin datos adicionales
test('acepta una consulta de disponibilidad exacta', () => {
  assert.deepEqual(
    validatePublicAvailabilityRequest({ dateKey: '2030-07-01' }, now),
    { dateKey: '2030-07-01' }
  );
  assert.throws(
    () => validatePublicAvailabilityRequest({ dateKey: '2030-07-01', email: 'x' }, now),
    /consulta de disponibilidad/
  );
});
