// Define una fecha estable para los intentos
export const attemptDate = new Date('2026-07-29T21:00:00.000Z');

// Construye una venta válida pendiente
export const buildTicketSale = (overrides = {}) => ({
  schemaVersion: 1,
  estado: 'pagada',
  folio: 'LS-TEST',
  tipo: 'mostrador',
  clienteNombre: 'Cliente Ticket',
  clienteEmail: 'cliente@example.com',
  creadaEn: new Date('2026-07-29T20:30:00.000Z'),
  items: [{
    nombre: 'Producto Real',
    cantidad: 1,
    precioUnitarioCentavos: 10_000,
    totalCentavos: 10_000
  }],
  desglose: {
    subtotalCentavos: 8_621,
    ivaIncluidoCentavos: 1_379,
    totalCentavos: 10_000,
    anticipoAplicadoCentavos: 0,
    saldoCobradoCentavos: 10_000
  },
  metodosPago: ['tarjeta'],
  ticket: {
    estado: 'pendiente',
    intentos: 0,
    intentoId: null,
    ultimoIntentoEn: null,
    enviadoEn: null,
    ultimoError: ''
  },
  ...overrides
});

// Crea un Firestore transaccional en memoria
export const createTicketFirestore = (
  seed,
  { failingTransactions = [] } = {}
) => {
  // Conserva documentos aislados por ruta
  const documents = new Map(
    Object.entries(seed).map(([path, value]) => [
      path,
      structuredClone(value)
    ])
  );

  // Conserva los fallos solicitados
  const transactionFailures = new Set(failingTransactions);

  // Conserva la posición transaccional
  let transactionNumber = 0;

  // Construye una referencia observable
  const buildReference = (collectionName, id) => ({
    id,
    path: `${collectionName}/${id}`
  });

  // Construye una instantánea actual
  const buildSnapshot = (path) => {
    // Obtiene el valor vigente
    const value = documents.get(path);

    // Devuelve el contrato mínimo de Firestore
    return {
      exists: value !== undefined,
      id: path.split('/').at(-1),
      data: () => value
    };
  };

  // Ejecuta una transacción serial de prueba
  const runTransaction = async (operation) => {
    transactionNumber += 1;

    // Simula únicamente los fallos solicitados
    if (transactionFailures.has(transactionNumber)) {
      throw new Error('Fallo transaccional controlado');
    }

    // Ejecuta la operación con lecturas consistentes
    return operation({
      get: async (reference) => buildSnapshot(reference.path),
      getAll: async (...references) => (
        references.map((reference) => buildSnapshot(reference.path))
      ),
      update: (reference, values) => {
        // Obtiene el documento vigente
        const current = documents.get(reference.path);

        // Persiste la actualización superficial
        documents.set(reference.path, { ...current, ...values });
      }
    });
  };

  // Define la fachada requerida por los handlers
  const firestore = {
    collection: (collectionName) => ({
      doc: (id) => buildReference(collectionName, id)
    }),
    runTransaction
  };

  // Permite verificar el estado final
  const read = (path) => documents.get(path);

  // Devuelve el entorno aislado
  return { firestore, read };
};
