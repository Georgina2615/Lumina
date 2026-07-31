import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CancelAppointmentModal,
  ConfirmAppointmentModal,
  NoShowAppointmentModal,
  ReceptionKanbanBoard
} from '../components';
import { useReceptionKanban } from '../hooks';

// Controla el panel operativo de recepción
export default function ReceptionDashboard() {
  const navigate = useNavigate();
  const [activeDialog, setActiveDialog] = useState(null);

  // Obtiene datos acciones y contactos del tablero
  const {
    pendingAppointments,
    confirmedAppointments,
    inCabinAppointments,
    checkoutAppointments,
    contactsByClientId,
    loading,
    error,
    isProcessingAppointment,
    confirmAppointment,
    moveAppointmentToCabin,
    moveAppointmentToCheckout,
    cancelReceptionAppointment,
    markAppointmentNoShow,
    clearError
  } = useReceptionKanban();

  // Relaciona cada columna con sus citas
  const appointmentsByColumn = {
    pending: pendingAppointments,
    confirmed: confirmedAppointments,
    inCabin: inCabinAppointments,
    checkout: checkoutAppointments
  };
  const allAppointments = Object.values(appointmentsByColumn).flat();
  const selectedAppointment = allAppointments.find(
    (appointment) => appointment.id === activeDialog?.appointmentId
  ) ?? null;
  const selectedContact = contactsByClientId[
    selectedAppointment?.clienteId
  ];

  // Abre una acción y limpia errores anteriores
  const openDialog = (type, appointmentId) => {
    clearError();
    setActiveDialog({ type, appointmentId });
  };

  // Cierra la acción vigente
  const closeDialog = () => {
    clearError();
    setActiveDialog(null);
  };

  // Ejecuta una acción y conserva errores visibles
  const runAction = async (action, closeOnSuccess = false) => {
    try {
      await action();
      if (closeOnSuccess) {
        setActiveDialog(null);
      }
      return true;
    } catch {
      return false;
    }
  };

  // Abre el cobro usando la cita persistida
  const openCheckout = (appointmentId) => {
    navigate(`/dashboard/reception/venta?appointmentId=${encodeURIComponent(appointmentId)}`);
  };

  // Envía la cita al cobro antes de navegar
  const sendToCheckout = async (appointmentId) => {
    const moved = await runAction(
      () => moveAppointmentToCheckout(appointmentId)
    );

    if (moved) {
      openCheckout(appointmentId);
    }
  };

  // Presenta la primera carga del tablero
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-muted">
        Cargando el tablero
      </div>
    );
  }

  // Devuelve el tablero conectado en tiempo real
  return (
    <div className="flex h-full flex-col gap-6">
      <header>
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
          Recepción
        </p>
        <h1 className="font-title text-3xl font-bold text-primary">
          Panel de Recepción
        </h1>
        <p className="mt-1 text-muted">Control de citas en tiempo real</p>
      </header>

      {error && !activeDialog && (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-error/20 bg-error/10 px-4 py-3 text-sm text-error"
          role="alert">
          <span>{error}</span>
          <button className="rounded-lg px-3 py-1 font-semibold transition hover:bg-error/10"
            onClick={clearError} type="button">Cerrar</button>
        </div>
      )}

      <ReceptionKanbanBoard appointmentsByColumn={appointmentsByColumn}
        contactsByClientId={contactsByClientId}
        isProcessingAppointment={isProcessingAppointment}
        onCancel={(appointmentId) => openDialog('cancel', appointmentId)}
        onConfirm={(appointmentId) => openDialog('confirm', appointmentId)}
        onMoveToCabin={(appointmentId) => runAction(
          () => moveAppointmentToCabin(appointmentId)
        )}
        onMoveToCheckout={sendToCheckout}
        onNoShow={(appointmentId) => openDialog('noShow', appointmentId)}
        onOpenCheckout={openCheckout}
        onOpenClientDirectory={() => navigate('/dashboard/reception/clientes')} />

      <ConfirmAppointmentModal appointment={
        activeDialog?.type === 'confirm' ? selectedAppointment : null
      } clientContact={selectedContact} error={error}
        isSubmitting={isProcessingAppointment(selectedAppointment?.id)}
        key={`confirm-${selectedAppointment?.id ?? 'closed'}`}
        onClose={closeDialog} onConfirm={(channel) => runAction(
          () => confirmAppointment(selectedAppointment.id, channel),
          true
        )} />
      <CancelAppointmentModal appointment={
        activeDialog?.type === 'cancel' ? selectedAppointment : null
      } canCancel={Boolean(selectedAppointment?.canCancel)} error={error}
        isSubmitting={isProcessingAppointment(selectedAppointment?.id)}
        key={`cancel-${selectedAppointment?.id ?? 'closed'}`}
        onClose={closeDialog} onConfirm={(reason, origin) => runAction(
          () => cancelReceptionAppointment(
            selectedAppointment.id,
            { reason, origin }
          ),
          true
        )} />
      <NoShowAppointmentModal appointment={
        activeDialog?.type === 'noShow' ? selectedAppointment : null
      } error={error}
        isSubmitting={isProcessingAppointment(selectedAppointment?.id)}
        key={`no-show-${selectedAppointment?.id ?? 'closed'}`}
        onClose={closeDialog} onConfirm={(reason) => runAction(
          () => markAppointmentNoShow(selectedAppointment.id, reason),
          true
        )} />
    </div>
  );
}
