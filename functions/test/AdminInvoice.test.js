import assert from 'node:assert/strict';
import test from 'node:test';
import { HttpsError } from 'firebase-functions/v2/https';
import { mapAdminInvoiceDocument } from '../src/AdminInvoiceDocuments.js';
import {
  getNextInvoiceStatus,
  requireInvoiceAdmin,
  validateAdminInvoiceRequest
} from '../src/AdminInvoicePolicy.js';
import { manageAdminInvoiceRequestHandler } from '../src/ManageAdminInvoiceRequest.js';
import { FakeAppointmentFirestore } from './AppointmentTransactionFixture.js';

const validRequest = {
  action: 'prepare',
  expectedRevision: 0,
  fiscalFolio: 'FACTURA-001',
  invoiceId: 'sale-1',
  note: 'Factura preparada para entrega'
};

test('acepta los cambios permitidos de una factura', () => {
  assert.deepEqual(validateAdminInvoiceRequest(validRequest), validRequest);
  assert.equal(getNextInvoiceStatus('pendiente', 'prepare'), 'preparada');
  assert.equal(getNextInvoiceStatus('preparada', 'deliver'), 'entregada');
});

test('rechaza una cuenta que no es administradora', () => {
  assert.throws(
    () => requireInvoiceAdmin({
      exists: true,
      data: () => ({ activo: true, rol: 'recepcion' })
    }),
    (error) => error instanceof HttpsError && error.code === 'permission-denied'
  );
});

test('oculta documentos fiscales incompletos', () => {
  assert.equal(mapAdminInvoiceDocument({
    id: 'sale-1',
    data: () => ({ schemaVersion: 1, estado: 'pendiente', revision: 0 })
  }), null);
});

test('prepara una solicitud y conserva su revisión', async () => {
  const firestore = new FakeAppointmentFirestore({
    'usuarios/admin': { activo: true, rol: 'admin' },
    'solicitudesFactura/sale-1': {
      schemaVersion: 1,
      estado: 'pendiente',
      revision: 0
    }
  });
  const result = await manageAdminInvoiceRequestHandler({
    auth: { uid: 'admin' },
    data: validRequest,
    firestore,
    serverTimestamp: () => 'SERVER_TIMESTAMP'
  });
  const stored = firestore.get('solicitudesFactura/sale-1');

  assert.deepEqual(result, {
    invoiceId: 'sale-1',
    revision: 1,
    status: 'preparada'
  });
  assert.equal(stored.estado, 'preparada');
  assert.equal(stored.folioFiscal, 'FACTURA-001');
  assert.equal(stored.procesadaPor, 'admin');
});
