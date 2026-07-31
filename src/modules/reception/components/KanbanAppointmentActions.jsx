import { appointmentStatus } from '../services/AppointmentService';

// Define clases compartidas para acciones principales
const primaryButton = 'rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-surface shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50';
const secondaryButton = 'rounded-xl border border-surface-hover px-4 py-2 text-sm font-semibold text-muted transition hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50';
const dangerButton = 'rounded-xl px-4 py-2 text-sm font-semibold text-error transition hover:bg-error/10 disabled:cursor-not-allowed disabled:opacity-50';

// Presenta acciones válidas según el estado vigente
export default function KanbanAppointmentActions({
  appointment,
  isProcessing,
  onConfirm,
  onCancel,
  onNoShow,
  onMoveToCabin,
  onMoveToCheckout,
  onOpenCheckout
}) {
  // Presenta acciones de una cita pendiente
  if (appointment.estado === appointmentStatus.pending) {
    return (
      <>
        <button className={primaryButton} disabled={isProcessing}
          onClick={onConfirm} type="button">Confirmar</button>
        {appointment.canMarkNoShow && (
          <button className={secondaryButton} disabled={isProcessing}
            onClick={onNoShow} type="button">No asistió</button>
        )}
        <button className={dangerButton} disabled={isProcessing}
          onClick={onCancel} type="button">Cancelar</button>
      </>
    );
  }

  // Presenta acciones de una cita confirmada
  if (appointment.estado === appointmentStatus.confirmed) {
    return (
      <>
        <button className={primaryButton} disabled={isProcessing}
          onClick={onMoveToCabin} type="button">Pasar a cabina</button>
        {appointment.canMarkNoShow && (
          <button className={secondaryButton} disabled={isProcessing}
            onClick={onNoShow} type="button">No asistió</button>
        )}
        <button className={dangerButton} disabled={isProcessing}
          onClick={onCancel} type="button">Cancelar</button>
      </>
    );
  }

  // Presenta la acción de una cita en cabina
  if (appointment.estado === appointmentStatus.inCabin) {
    return (
      <button className={primaryButton} disabled={isProcessing}
        onClick={onMoveToCheckout} type="button">Ir a cobrar</button>
    );
  }

  // Presenta la acción de una cita pendiente de cobro
  return (
    <button className={primaryButton} disabled={isProcessing}
      onClick={onOpenCheckout} type="button">Abrir cobro</button>
  );
}
