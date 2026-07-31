import PaymentEvidenceFields from './PaymentEvidenceFields';
import MixedDepositFields from './MixedDepositFields';
import {
  createPaymentDraft,
  createPaymentPart,
  syncCashReceived
} from '../services/PaymentPolicy';

// Define los métodos simples permitidos
const paymentMethods = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'transferencia', label: 'Transferencia' }
];

// Formatea centavos como moneda nacional
const formatCurrency = (cents) => new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN'
}).format(cents / 100);

// Convierte una entrada visible a centavos seguros
const getInputCents = (value) => {
  // Calcula el importe capturado
  const cents = Math.round(Number(value) * 100);

  // Devuelve únicamente importes utilizables
  return Number.isSafeInteger(cents) && cents >= 0 ? cents : 0;
};

// Presenta el registro real del anticipo
export default function ReceptionPaymentSection({
  depositCents,
  payment,
  onChange
}) {
  // Detecta el desglose combinado
  const isMixed = payment.method === 'mixto';

  // Actualiza una parte del pago
  const updatePart = (partName, changes) => {
    // Construye la parte modificada
    const nextPart = { ...payment[partName], ...changes };

    // Actualiza evidencia sin modificar el desglose
    if (!isMixed || partName !== 'primary' || !('amount' in changes)) {
      onChange({ ...payment, [partName]: nextPart });
      return;
    }

    // Sincroniza el efectivo con ambos importes aplicados
    const primaryAmountCents = getInputCents(nextPart.amount);
    const remainingCents = Math.max(
      depositCents - primaryAmountCents,
      0
    );

    // Entrega ambas partes actualizadas
    onChange({
      ...payment,
      primary: syncCashReceived(nextPart, primaryAmountCents),
      secondary: syncCashReceived(payment.secondary, remainingCents)
    });
  };

  // Cambia el método general
  const handleMethodChange = (method) => {
    // Crea un pago limpio
    const nextPayment = createPaymentDraft();
    nextPayment.method = method;
    nextPayment.primary = createPaymentPart(
      method === 'mixto' ? 'efectivo' : method,
      method === 'mixto' ? 0 : depositCents
    );

    // Entrega el nuevo pago
    onChange(nextPayment);
  };

  // Cambia el método de una parte
  const handlePartMethodChange = (partName, method) => {
    // Calcula el importe correspondiente a la parte
    const primaryAmountCents = getInputCents(payment.primary.amount);
    const appliedAmountCents = partName === 'primary'
      ? primaryAmountCents
      : Math.max(depositCents - primaryAmountCents, 0);

    // Reemplaza evidencia de un método anterior
    onChange({
      ...payment,
      [partName]: createPaymentPart(method, appliedAmountCents)
    });
  };

  // Devuelve la captura del anticipo
  return (
    <section className="border-t border-surface-hover pt-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            Anticipo obligatorio
          </p>
          <h3 className="mt-1 font-title text-lg font-semibold text-primary">
            Registrar pago del treinta por ciento
          </h3>
        </div>
        <p className="font-title text-2xl font-bold text-primary">
          {formatCurrency(depositCents)}
        </p>
      </div>

      <fieldset>
        <legend className="sr-only">Método del anticipo</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[...paymentMethods, { value: 'mixto', label: 'Mixto' }].map((method) => (
            <button
              aria-pressed={payment.method === method.value}
              className={`rounded-xl border px-3 py-3 text-sm font-semibold transition duration-200 active:scale-[0.98] ${
                payment.method === method.value
                  ? 'border-primary bg-primary text-surface shadow-sm'
                  : 'border-surface-hover bg-background text-muted hover:border-primary/40 hover:text-primary'
              }`}
              key={method.value}
              onClick={() => handleMethodChange(method.value)}
              type="button"
            >
              {method.label}
            </button>
          ))}
        </div>
      </fieldset>

      {payment.method && !isMixed && (
        <div className="mt-4 rounded-2xl border border-surface-hover bg-background p-4">
          <PaymentEvidenceFields
            amountCents={depositCents}
            idPrefix="deposit-primary"
            onChange={(changes) => updatePart('primary', changes)}
            part={payment.primary}
          />
        </div>
      )}

      {isMixed && (
        <MixedDepositFields
          depositCents={depositCents}
          methods={paymentMethods}
          onMethodChange={handlePartMethodChange}
          onPartChange={updatePart}
          payment={payment}
        />
      )}

      <p className="mt-3 text-xs leading-5 text-muted">
        El anticipo reserva el horario y la asistencia se confirma por separado
      </p>
    </section>
  );
}
