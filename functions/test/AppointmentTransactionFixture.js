// Copia valores simples para aislar cada lectura
const clone = (value) => structuredClone(value);

// Representa una referencia documental mínima
class FakeReference {
  // Conserva la ruta e identidad
  constructor(path) {
    this.path = path;
    this.id = path.split('/').at(-1);
  }
}

// Representa una lectura documental mínima
class FakeSnapshot {
  // Conserva la referencia y sus datos
  constructor(reference, data) {
    this.ref = reference;
    this.id = reference.id;
    this.exists = data !== undefined;
    this.value = data;
  }

  // Devuelve una copia de los datos
  data() {
    return this.exists ? clone(this.value) : undefined;
  }
}

// Simula únicamente el contrato transaccional usado
class FakeTransaction {
  // Conserva datos y escrituras pendientes
  constructor(documents) {
    this.documents = documents;
    this.creations = [];
    this.updates = [];
    this.deletions = [];
    this.hasWritten = false;
  }

  // Lee una referencia antes de escribir
  async get(reference) {
    if (this.hasWritten) {
      throw new Error('Las lecturas deben ocurrir antes de las escrituras');
    }

    return new FakeSnapshot(
      reference,
      this.documents.get(reference.path)
    );
  }

  // Lee varias referencias en orden
  async getAll(...references) {
    return Promise.all(
      references.map((reference) => this.get(reference))
    );
  }

  // Programa una creación exclusiva
  create(reference, data) {
    this.hasWritten = true;

    if (
      this.documents.has(reference.path)
      || this.creations.some(({ path }) => path === reference.path)
    ) {
      throw new Error(`El documento ${reference.path} ya existe`);
    }

    this.creations.push({
      path: reference.path,
      data: clone(data)
    });

    return this;
  }

  // Programa una actualizacion
  update(reference, data) {
    this.hasWritten = true;

    if (!this.documents.has(reference.path)) {
      throw new Error(`El documento ${reference.path} no existe`);
    }

    this.updates.push({
      path: reference.path,
      data: clone(data)
    });

    return this;
  }

  // Programa una eliminacion
  delete(reference) {
    this.hasWritten = true;
    this.deletions.push(reference.path);
    return this;
  }

  // Confirma todas las escrituras
  commit() {
    this.creations.forEach(({ path, data }) => {
      this.documents.set(path, data);
    });

    this.updates.forEach(({ path, data }) => {
      this.documents.set(path, {
        ...this.documents.get(path),
        ...data
      });
    });

    this.deletions.forEach((path) => {
      this.documents.delete(path);
    });
  }
}

// Simula las operaciones necesarias de Firestore
export class FakeAppointmentFirestore {
  // Prepara documentos e identificadores
  constructor(seed = {}) {
    this.documents = new Map(
      Object.entries(seed).map(([path, data]) => [path, clone(data)])
    );
    this.counters = new Map();
    this.lastTransaction = null;
  }

  // Construye referencias de una colección
  collection(name) {
    return {
      doc: (id) => {
        // Genera una identidad cuando no se proporciona
        if (!id) {
          const next = (this.counters.get(name) ?? 0) + 1;
          this.counters.set(name, next);
          id = `${name}_${next}`;
        }

        return new FakeReference(`${name}/${id}`);
      }
    };
  }

  // Ejecuta una transacción aislada
  async runTransaction(callback) {
    const transaction = new FakeTransaction(this.documents);
    this.lastTransaction = transaction;
    const result = await callback(transaction);
    transaction.commit();
    return result;
  }

  // Obtiene un documento persistido
  get(path) {
    return this.documents.get(path);
  }
}

// Construye el catálogo operativo mínimo
export const buildAppointmentSeed = (overrides = {}) => ({
  'usuarios/actor': {
    activo: true,
    rol: 'recepcion'
  },
  'servicios/limpieza-profunda': {
    activo: true,
    nombre: 'Limpieza facial profunda',
    precioCentavos: 45_000,
    duracionServicioMinutos: 150,
    tiempoPreparacionMinutos: 30,
    duracionBloqueMinutos: 180,
    porcentajeAnticipo: 30
  },
  ...overrides
});

// Construye una solicitud canónica
export const buildCanonicalAppointmentRequest = ({
  client = {
    id: null,
    fullName: 'María López',
    phone: '9811017687',
    email: 'maria@example.com'
  }
} = {}) => ({
  client,
  contactChannel: 'correo',
  serviceId: 'limpieza-profunda',
  dateKey: '2026-08-04',
  time: '10:00',
  interval: {
    dateKey: '2026-08-04',
    time: '10:00',
    start: new Date('2026-08-04T16:00:00.000Z'),
    treatmentEnd: new Date('2026-08-04T18:30:00.000Z'),
    blockEnd: new Date('2026-08-04T19:00:00.000Z')
  },
  deposit: {
    method: 'mixto',
    payments: [
      {
        method: 'efectivo',
        amountCents: 3_500,
        cashReceivedCents: 3_500,
        changeCents: 0,
        reference: '',
        cardLastFour: ''
      },
      {
        method: 'transferencia',
        amountCents: 10_000,
        cashReceivedCents: 0,
        changeCents: 0,
        reference: 'SPEI-90871',
        cardLastFour: ''
      }
    ]
  }
});
