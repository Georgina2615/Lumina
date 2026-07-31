import { useReceptionAppointmentForm } from '../hooks/UseReceptionAppointmentForm';
import AppointmentCreditSelector from './AppointmentCreditSelector';
import ReceptionClientSection from './ReceptionClientSection';
import ReceptionDetailsSection from './ReceptionDetailsSection';
import ReceptionPaymentSection from './ReceptionPaymentSection';

// Presenta la creación presencial
export default function ReceptionAppointmentForm(props) {
  const {
    clientSectionProps,
    creditSelectorProps,
    detailsSectionProps,
    error,
    handleSubmit,
    handleSuccessClose,
    isBooking,
    isRescheduled,
    onClose,
    paymentSectionProps,
    registeredName,
    showPayment,
    showCreditSelector,
    submitLabel,
    submitDisabled,
    success
  } = useReceptionAppointmentForm(props);

  if (success) {
    return (
      <div
        aria-live="polite"
        className="m-5 rounded-2xl border border-status-pending/30 bg-status-pending/10 p-7 text-center sm:m-6"
        role="status"
      >
        <h3 className="font-title text-2xl font-bold text-primary">
          {isRescheduled ? 'Cita reprogramada' : 'Cita registrada'}
        </h3>
        <p className="mt-2 text-sm text-muted">
          La cita de <strong className="text-primary">{registeredName}</strong>
          {isRescheduled
            ? ' quedó reprogramada y pendiente de confirmación'
            : ' quedó reservada y pendiente de confirmación'}
        </p>
        <button
          className="mt-6 rounded-xl bg-primary px-6 py-3 font-semibold text-surface"
          onClick={handleSuccessClose}
          type="button"
        >
          Cerrar
        </button>
      </div>
    );
  }

  return (
    <form
      aria-busy={isBooking}
      className="flex flex-col gap-6 p-5 sm:p-6"
      onSubmit={handleSubmit}
    >
      <ReceptionClientSection {...clientSectionProps} />
      {showCreditSelector && (
        <AppointmentCreditSelector {...creditSelectorProps} />
      )}
      <ReceptionDetailsSection {...detailsSectionProps} />
      {showPayment && <ReceptionPaymentSection {...paymentSectionProps} />}
      {error && (
        <div
          aria-live="assertive"
          className="rounded-2xl border border-error/20 bg-error/10 p-3 text-sm text-error"
          role="alert"
        >
          {error}
        </div>
      )}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          className="rounded-xl border border-surface-hover px-5 py-3 font-semibold text-muted"
          disabled={isBooking}
          onClick={onClose}
          type="button"
        >
          Cancelar
        </button>
        <button
          className="rounded-xl bg-primary px-6 py-3 font-semibold text-surface disabled:cursor-not-allowed disabled:opacity-50"
          disabled={submitDisabled}
          type="submit"
        >
          {isBooking ? 'Registrando cita' : submitLabel}
        </button>
      </div>
    </form>
  );
}
