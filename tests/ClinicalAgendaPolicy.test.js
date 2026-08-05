import assert from 'node:assert/strict';
import test from 'node:test';
import {
  clinicalAppointmentStatus,
  groupClinicalAppointments,
  mapClinicalAppointment,
  sortClinicalAppointments
} from '../src/modules/clinical/agenda/services/ClinicalAgendaPolicy.js';

const buildAppointment = (overrides = {}) => ({
  clienteId: 'cliente-1',
  estado: clinicalAppointmentStatus.confirmed,
  fecha: '2026-08-04',
  hora: '10:00',
  nombreCompleto: 'Mariana Escobedo',
  servicio: 'Limpieza facial profunda',
  ...overrides
});

test('convierte una cita real para la agenda clínica', () => {
  const appointment = mapClinicalAppointment('cita-1', buildAppointment());

  assert.equal(appointment.clientName, 'Mariana Escobedo');
  assert.equal(appointment.status, clinicalAppointmentStatus.confirmed);
});

test('descarta citas canceladas y documentos incompletos', () => {
  assert.equal(mapClinicalAppointment('cita-1', buildAppointment({ estado: 'cancelada' })), null);
  assert.equal(mapClinicalAppointment('cita-2', buildAppointment({ hora: null })), null);
});

test('ordena y separa las citas por su momento operativo', () => {
  const appointments = sortClinicalAppointments([
    mapClinicalAppointment('cita-2', buildAppointment({ estado: 'en_cabina', hora: '17:00' })),
    mapClinicalAppointment('cita-1', buildAppointment({ hora: '10:00' })),
    mapClinicalAppointment('cita-3', buildAppointment({ estado: 'finalizada', hora: '14:00' }))
  ]);
  const groups = groupClinicalAppointments(appointments);

  assert.deepEqual(appointments.map(({ id }) => id), ['cita-1', 'cita-3', 'cita-2']);
  assert.equal(groups.active.length, 1);
  assert.equal(groups.upcoming.length, 1);
  assert.equal(groups.completed.length, 1);
});
