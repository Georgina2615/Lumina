import { formatCurrency } from '../services/SaleCalculationService';
import POSMixedPaymentFields from './POSMixedPaymentFields';
import POSPaymentEvidenceFields from './POSPaymentEvidenceFields';

// Agrupa la distribución y las evidencias del pago
export default function POSPaymentFields({
  form,
  preview,
  amountDueCents,
  onChange
}) {
  // Detecta una distribución mixta
  const isMixed = form.method === 'mixto';
  // Enumera métodos presentes
  const selectedMethods = isMixed
    ? [form.primaryMethod, form.secondaryMethod]
    : [form.method];

  // Devuelve distribución y evidencia
  return (
    <div className="space-y-4">
      {isMixed && (
        <POSMixedPaymentFields
          form={form}
          secondaryAmountCents={preview.secondaryAmountCents}
          onChange={onChange}
        />
      )}
      <POSPaymentEvidenceFields
        form={form}
        preview={preview}
        selectedMethods={selectedMethods}
        onChange={onChange}
      />
      <p className="text-center text-[11px] text-muted">
        El total de los pagos debe cubrir {formatCurrency(amountDueCents)}
      </p>
    </div>
  );
}
