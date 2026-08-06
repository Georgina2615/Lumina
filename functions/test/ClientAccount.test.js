import assert from 'node:assert/strict';
import test from 'node:test';
import { HttpsError } from 'firebase-functions/v2/https';
import {
  buildVisibleAppointment
} from '../src/ClientAccountDocuments.js';
import {
  requireVerifiedClientEmail
} from '../src/ClientAccountPolicy.js';
import { getClientAccountHandler } from '../src/GetClientAccount.js';

// Crea una cita privada con datos que no deben salir
const createAppointmentSnapshot = () => ({
  id: 'appointment-1',
  data: () => ({
    clienteId: 'client-1',
    servicio: 'Limpieza facial profunda',
    fecha: '2026-08-08',
    hora: '10:00',
    estado: 'confirmada',
    anticipoPagado: true,
    anticipoMontoCentavos: 13500,
    notasClinicas: 'dato privado',
    fichaTecnica: { alergias: 'dato privado' },
    anticipoPagos: [{ metodo: 'efectivo' }]
  })
});

test('exige un correo autenticado y verificado', () => {
  assert.throws(
    () => requireVerifiedClientEmail({
      uid: 'client-auth',
      token: { email: 'clienta@example.com', email_verified: false }
    }),
    (error) => error instanceof HttpsError
      && error.code === 'unauthenticated'
  );
});

test('normaliza el correo verificado', () => {
  const email = requireVerifiedClientEmail({
    uid: 'client-auth',
    token: { email: ' Clienta@Example.com ', email_verified: true }
  });
  assert.equal(email, 'clienta@example.com');
});

test('devuelve solo campos seguros de la cita', () => {
  const appointment = buildVisibleAppointment(createAppointmentSnapshot());
  assert.deepEqual(Object.keys(appointment).sort(), [
    'cancellationOrigin',
    'cancellationReason',
    'date',
    'depositAmountCents',
    'depositPaid',
    'id',
    'serviceName',
    'startAt',
    'status',
    'time'
  ]);
  assert.equal('notasClinicas' in appointment, false);
  assert.equal('fichaTecnica' in appointment, false);
  assert.equal('anticipoPagos' in appointment, false);
});

// Crea una base mínima para comprobar el aislamiento
const createFirestore = () => {
  const clients = {
    'client-1': {
      nombreCompleto: 'Ana Prueba',
      emailNormalizado: 'ana@example.com',
      telefono: '9810000001'
    },
    'client-2': {
      nombreCompleto: 'Beatriz Prueba',
      emailNormalizado: 'beatriz@example.com',
      telefono: '9810000002'
    }
  };
  const appointments = [
    { id: 'appointment-1', clienteId: 'client-1', servicio: 'Anti acné' },
    { id: 'appointment-2', clienteId: 'client-2', servicio: 'Anti edad' }
  ];
  const createSnapshot = (id, data) => ({
    id,
    exists: Boolean(data),
    data: () => data
  });
  return {
    collection: (name) => ({
      doc: (id) => ({
        get: async () => {
          if (name === 'identidadesClientes') {
            const clientId = id === 'correo:ana@example.com'
              ? 'client-1'
              : null;
            return createSnapshot(id, clientId
              ? { tipo: 'correo', clienteId: clientId }
              : null);
          }
          return createSnapshot(id, clients[id]);
        }
      }),
      where: (_field, _operator, clientId) => ({
        limit: () => ({
          get: async () => ({
            docs: appointments
              .filter((item) => item.clienteId === clientId)
              .map((item) => createSnapshot(item.id, {
                ...item,
                fecha: '2026-08-08',
                hora: '10:00',
                estado: 'confirmada',
                anticipoMontoCentavos: 15000
              }))
          })
        })
      })
    })
  };
};

test('aísla las citas mediante el correo verificado', async () => {
  const result = await getClientAccountHandler({
    auth: {
      uid: 'auth-ana',
      token: { email: 'ana@example.com', email_verified: true }
    },
    firestore: createFirestore()
  });
  assert.equal(result.client.id, 'client-1');
  assert.deepEqual(
    result.appointments.map(({ id }) => id),
    ['appointment-1']
  );
  assert.equal(
    result.appointments.some(({ id }) => id === 'appointment-2'),
    false
  );
});
