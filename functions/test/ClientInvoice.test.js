import assert from 'node:assert/strict';
import test from 'node:test';
import { HttpsError } from 'firebase-functions/v2/https';
import { requestClientInvoiceHandler } from '../src/RequestClientInvoice.js';
import {
  requireInvoiceSale,
  validateClientInvoiceRequest
} from '../src/ClientInvoicePolicy.js';

const validRequest = {
  saleId: 'sale-1',
  taxId: 'BARA900101AB1',
  taxpayerName: 'ANA BALAM REYES',
  postalCode: '24000',
  taxRegime: '605',
  invoiceUse: 'G03',
  deliveryEmail: 'ana@example.com'
};

// Crea una referencia mínima con identidad estable
const createReference = (documents, collection, id) => ({
  id,
  path: `${collection}/${id}`,
  get: async () => {
    const data = documents.get(`${collection}/${id}`);
    return { exists: Boolean(data), data: () => data, id };
  }
});

// Crea una base transaccional para la solicitud
const createFirestore = () => {
  const documents = new Map([
    ['identidadesClientes/correo:ana@example.com', {
      tipo: 'correo',
      clienteId: 'client-1'
    }],
    ['clientes/client-1', {
      nombreCompleto: 'Ana Balam',
      emailNormalizado: 'ana@example.com'
    }],
    ['ventas/sale-1', {
      schemaVersion: 1,
      estado: 'pagada',
      clienteId: 'client-1',
      citaId: 'appointment-1',
      folio: 'LS-001',
      desglose: { totalCentavos: 90000 }
    }]
  ]);
  return {
    collection: (name) => ({
      doc: (id) => createReference(documents, name, id)
    }),
    runTransaction: async (callback) => callback({
      get: (reference) => reference.get(),
      create: (reference, data) => documents.set(reference.path, data)
    }),
    documents
  };
};

test('normaliza datos fiscales permitidos', () => {
  assert.deepEqual(validateClientInvoiceRequest({
    ...validRequest,
    taxId: ' bara900101ab1 ',
    deliveryEmail: ' ANA@EXAMPLE.COM '
  }), validRequest);
});

test('rechaza un RFC o código postal inválido', () => {
  assert.throws(
    () => validateClientInvoiceRequest({
      ...validRequest,
      taxId: 'NO VALIDO',
      postalCode: '24'
    }),
    (error) => error instanceof HttpsError
      && error.code === 'invalid-argument'
  );
});

test('rechaza una venta que pertenece a otra clienta', () => {
  assert.throws(
    () => requireInvoiceSale({
      exists: true,
      data: () => ({
        schemaVersion: 1,
        estado: 'pagada',
        clienteId: 'client-2',
        folio: 'LS-001',
        desglose: { totalCentavos: 90000 }
      })
    }, 'client-1'),
    (error) => error instanceof HttpsError
      && error.code === 'failed-precondition'
  );
});

test('crea una sola solicitud para la venta pagada', async () => {
  const firestore = createFirestore();
  const input = {
    auth: {
      uid: 'auth-1',
      token: { email: 'ana@example.com', email_verified: true }
    },
    data: validRequest,
    firestore
  };
  const firstResult = await requestClientInvoiceHandler(input);
  const secondResult = await requestClientInvoiceHandler(input);
  const stored = firestore.documents.get('solicitudesFactura/sale-1');

  assert.deepEqual(firstResult, {
    invoiceStatus: 'pendiente',
    saleId: 'sale-1'
  });
  assert.deepEqual(secondResult, firstResult);
  assert.equal(stored.clienteId, 'client-1');
  assert.equal(stored.datosFiscales.rfc, validRequest.taxId);
  assert.equal(stored.totalVentaCentavos, 90000);
});
