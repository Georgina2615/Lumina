// Define el destino oficial de EmailJS
const EMAILJS_ENDPOINT = 'https://api.emailjs.com/api/v1.0/email/send';

// Define el tiempo máximo de conexión
const DEFAULT_TIMEOUT_MS = 10_000;

// Define la separación mínima entre solicitudes
const DEFAULT_INTERVAL_MS = 1_000;

// Representa un fallo seguro del proveedor
export class EmailJsTransportError extends Error {
  // Conserva únicamente un código controlado
  constructor(code, message) {
    super(message);
    this.name = 'EmailJsTransportError';
    this.code = code;
  }
}

// Reconoce objetos de configuración
const isRecord = (value) => (
  value !== null
  && typeof value === 'object'
  && !Array.isArray(value)
);

// Normaliza una credencial requerida
const requireCredential = (value) => {
  // Limpia la credencial recibida
  const normalized = typeof value === 'string' ? value.trim() : '';

  // Detiene credenciales ausentes
  if (!normalized) {
    throw new EmailJsTransportError(
      'configuration',
      'La configuración de correo no está completa'
    );
  }

  // Devuelve la credencial comprobada
  return normalized;
};

// Valida la configuración secreta
const normalizeConfig = (config) => {
  // Detiene configuraciones que no son objetos
  if (!isRecord(config)) {
    throw new EmailJsTransportError(
      'configuration',
      'La configuración de correo no está disponible'
    );
  }

  // Devuelve únicamente credenciales conocidas
  return {
    serviceId: requireCredential(config.serviceId),
    templateId: requireCredential(config.templateId),
    publicKey: requireCredential(config.publicKey),
    privateKey: requireCredential(config.privateKey)
  };
};

// Espera un intervalo sin bloquear el proceso
const waitWithTimer = (milliseconds) => new Promise(
  (resolve) => setTimeout(resolve, milliseconds)
);

// Convierte respuestas del proveedor en errores seguros
const mapProviderStatus = (status) => {
  // Detecta límites temporales del proveedor
  if (status === 429) {
    return new EmailJsTransportError(
      'rate_limit',
      'El servicio de correo alcanzó su límite temporal'
    );
  }

  // Detecta credenciales rechazadas
  if (status === 401 || status === 403) {
    return new EmailJsTransportError(
      'authorization',
      'El servicio de correo rechazó la autorización'
    );
  }

  // Detecta contratos o plantillas inválidas
  if (status === 400 || status === 404 || status === 422) {
    return new EmailJsTransportError(
      'configuration',
      'El servicio de correo rechazó la configuración'
    );
  }

  // Oculta cualquier respuesta inesperada
  return new EmailJsTransportError(
    'provider',
    'El servicio de correo no pudo completar el envío'
  );
};

// Crea un transporte aislado e inyectable
export const createEmailJsTransport = ({
  fetchImpl = globalThis.fetch,
  intervalMs = DEFAULT_INTERVAL_MS,
  now = () => Date.now(),
  timeoutMs = DEFAULT_TIMEOUT_MS,
  wait = waitWithTimer
} = {}) => {
  // Conserva la cola exclusiva de esta instancia
  let requestQueue = Promise.resolve();

  // Conserva el siguiente inicio permitido
  let nextRequestAt = 0;

  // Envía una solicitud protegida
  const sendRequest = async ({ config, templateParameters }) => {
    // Detiene entornos sin transporte nativo
    if (typeof fetchImpl !== 'function') {
      throw new EmailJsTransportError(
        'network',
        'El transporte de correo no está disponible'
      );
    }

    // Detiene variables fuera del contrato
    if (!isRecord(templateParameters)) {
      throw new EmailJsTransportError(
        'configuration',
        'Las variables del ticket no son válidas'
      );
    }

    // Normaliza el secreto antes de conectar
    const credentials = normalizeConfig(config);

    // Calcula la espera necesaria
    const delayMs = Math.max(0, nextRequestAt - now());

    // Respeta el límite documentado del proveedor
    if (delayMs > 0) {
      await wait(delayMs);
    }

    // Reserva el siguiente intervalo
    nextRequestAt = now() + intervalMs;

    // Controla el tiempo máximo de conexión
    const controller = new AbortController();

    // Programa la cancelación local
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      // Construye el contrato oficial del proveedor
      const body = {
        service_id: credentials.serviceId,
        template_id: credentials.templateId,
        user_id: credentials.publicKey,
        template_params: templateParameters
      };

      // Incluye la autorización privada obligatoria
      body.accessToken = credentials.privateKey;

      // Envía únicamente el contrato permitido
      const response = await fetchImpl(EMAILJS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      // Detiene respuestas rechazadas sin leer su contenido
      if (!response?.ok) {
        throw mapProviderStatus(response?.status);
      }

      // Confirma el envío al orquestador
      return { accepted: true };
    } catch (error) {
      // Conserva errores ya saneados
      if (error instanceof EmailJsTransportError) {
        throw error;
      }

      // Detecta una cancelación por tiempo
      if (error?.name === 'AbortError') {
        throw new EmailJsTransportError(
          'timeout',
          'El servicio de correo tardó demasiado en responder'
        );
      }

      // Oculta los detalles de red
      throw new EmailJsTransportError(
        'network',
        'No fue posible conectar con el servicio de correo'
      );
    } finally {
      clearTimeout(timeoutId);
    }
  };

  // Serializa todos los envíos de esta instancia
  return (payload) => {
    // Encadena el siguiente envío incluso después de un fallo
    const operation = requestQueue.then(() => sendRequest(payload));

    // Conserva una cola recuperable
    requestQueue = operation.catch(() => undefined);

    // Devuelve el resultado individual
    return operation;
  };
};

// Comparte el límite entre invocaciones del mismo proceso
export const sendEmailJsTemplate = createEmailJsTransport();
