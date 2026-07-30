import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createEmailJsTransport,
  EmailJsTransportError
} from '../src/EmailJsTransport.js';

// Define una configuración privada de prueba
const config = {
  serviceId: 'service_test',
  templateId: 'template_test',
  publicKey: 'public_test',
  privateKey: 'private_test'
};

test('envía únicamente el contrato autorizado a EmailJS', async () => {
  // Conserva la solicitud observada
  let request;

  // Crea un transporte sin espera
  const transport = createEmailJsTransport({
    intervalMs: 0,
    fetchImpl: async (url, options) => {
      request = { url, options };
      // Simula una aceptación del proveedor
      return { ok: true, status: 200 };
    }
  });

  // Ejecuta un envío controlado
  const result = await transport({
    config,
    templateParameters: {
      to_email: 'cliente@example.com',
      folio: 'LS-TEST'
    }
  });

  assert.deepEqual(result, { accepted: true });
  assert.equal(
    request.url,
    'https://api.emailjs.com/api/v1.0/email/send'
  );
  assert.equal(request.options.method, 'POST');
  assert.equal(
    request.options.headers['Content-Type'],
    'application/json'
  );

  // Analiza el cuerpo sin mostrar credenciales
  const body = JSON.parse(request.options.body);

  assert.equal(body.service_id, config.serviceId);
  assert.equal(body.template_id, config.templateId);
  assert.equal(body.user_id, config.publicKey);
  assert.equal(body.accessToken, config.privateKey);
  assert.equal(body.template_params.folio, 'LS-TEST');
});

test('sanea respuestas rechazadas sin leer su contenido', async () => {
  // Detecta cualquier intento de leer el cuerpo
  let bodyWasRead = false;

  // Crea un transporte rechazado
  const transport = createEmailJsTransport({
    intervalMs: 0,
    fetchImpl: async () => ({
      ok: false,
      status: 429,
      text: async () => {
        bodyWasRead = true;
        // Simula contenido sensible
        return 'respuesta privada';
      }
    })
  });

  await assert.rejects(
    () => transport({
      config,
      templateParameters: { folio: 'LS-TEST' }
    }),
    (error) => (
      error instanceof EmailJsTransportError
      && error.code === 'rate_limit'
      && !error.message.includes('privada')
    )
  );
  assert.equal(bodyWasRead, false);
});

test('serializa solicitudes con un segundo de separación', async () => {
  // Simula el reloj del proceso
  let currentTime = 0;

  // Conserva las esperas solicitadas
  const waits = [];

  // Crea un transporte con reloj inyectado
  const transport = createEmailJsTransport({
    fetchImpl: async () => ({ ok: true, status: 200 }),
    now: () => currentTime,
    wait: async (milliseconds) => {
      waits.push(milliseconds);
      currentTime += milliseconds;
    }
  });

  await Promise.all([
    transport({ config, templateParameters: { folio: 'LS-1' } }),
    transport({ config, templateParameters: { folio: 'LS-2' } })
  ]);

  assert.deepEqual(waits, [1_000]);
});

test('rechaza secretos incompletos antes de conectar', async () => {
  // Conserva la cantidad de conexiones
  let calls = 0;

  // Crea un transporte observable
  const transport = createEmailJsTransport({
    intervalMs: 0,
    fetchImpl: async () => {
      calls += 1;
      // Evita una respuesta real
      return { ok: true, status: 200 };
    }
  });

  await assert.rejects(
    () => transport({
      config: { ...config, publicKey: '' },
      templateParameters: { folio: 'LS-TEST' }
    }),
    (error) => (
      error instanceof EmailJsTransportError
      && error.code === 'configuration'
    )
  );
  assert.equal(calls, 0);
});

test('exige autorización privada antes de conectar', async () => {
  // Conserva la cantidad de conexiones
  let calls = 0;

  // Crea un transporte observable
  const transport = createEmailJsTransport({
    intervalMs: 0,
    fetchImpl: async () => {
      calls += 1;
      // Evita una respuesta real
      return { ok: true, status: 200 };
    }
  });

  await assert.rejects(
    () => transport({
      config: { ...config, privateKey: '' },
      templateParameters: { folio: 'LS-TEST' }
    }),
    (error) => (
      error instanceof EmailJsTransportError
      && error.code === 'configuration'
    )
  );
  assert.equal(calls, 0);
});
