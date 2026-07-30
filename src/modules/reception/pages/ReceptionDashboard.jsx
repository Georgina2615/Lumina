import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppointmentCard } from '../../common/components';
import { CancelAppointmentModal, KanbanColumn } from '../components';
import { useReceptionKanban } from '../hooks';

// Controla el panel operativo de recepción
export default function ReceptionDashboard() {
  const navigate = useNavigate();

  // Obtiene el estado y las acciones del tablero
  const {
    pendingAppointments, confirmedAppointments, inCabinAppointments, checkoutAppointments,
    loading, error, isProcessingAppointment,
    confirmAppointment, moveAppointmentToCabin, moveAppointmentToCheckout,
    cancelReceptionAppointment, clearError
  } = useReceptionKanban();

  // Conserva la identidad de la cita elegida
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);

  // Obtiene siempre la versión vigente de la cita
  const selectedAppointment = [
    ...pendingAppointments, ...confirmedAppointments, ...inCabinAppointments
  ].find((appointment) => appointment.id === selectedAppointmentId) ?? null;

  // Ejecuta acciones y conserva el error de la lógica
  const handleAppointmentAction = async (action) => {
    try {
      await action();
      return true;
    } catch {
      // Mantiene el mensaje visible para la persona usuaria
      return false;
    }
  };

  // Abre el cobro usando la identidad persistente de la cita
  const openCheckout = (appointmentId) => {
    navigate(`/dashboard/pos?appointmentId=${encodeURIComponent(appointmentId)}`);
  };

  // Envía la cita al cobro antes de abrir el punto de venta
  const handleMoveToCheckout = async (appointmentId) => {
    const wasMoved = await handleAppointmentAction(
      () => moveAppointmentToCheckout(appointmentId)
    );

    // Navega solo después de confirmar la transición
    if (wasMoved) {
      openCheckout(appointmentId);
    }
  };

  // Abre la confirmación de cancelación
  const openCancellation = (appointment) => {
    clearError();
    setSelectedAppointmentId(appointment.id);
  };

  // Cierra la confirmación de cancelación
  const closeCancellation = () => {
    clearError();
    setSelectedAppointmentId(null);
  };

  // Confirma la cancelación con su motivo
  const confirmCancellation = async (reason) => {
    // Detiene acciones sin una cita vigente
    if (!selectedAppointment) {
      return;
    }
    await cancelReceptionAppointment(selectedAppointment.id, reason);
    setSelectedAppointmentId(null);
  };

  // Presenta el estado inicial del tablero
  if (loading) {
    // Devuelve una espera visual discreta
    return <div className="flex h-full items-center justify-center text-muted">Cargando el tablero</div>;
  }

  // Devuelve el tablero conectado en tiempo real
  return (
    <div className="flex h-full flex-col gap-6">
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Recepción</p>
        <h1 className="font-title text-3xl font-bold text-primary">Panel de Recepción</h1>
        <p className="mt-1 text-muted">Control de citas en tiempo real</p>
      </div>

      {error && !selectedAppointment && (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-error/20 bg-error/10 px-4 py-3 text-sm text-error" role="alert">
          <span>{error}</span>
          <button className="rounded-lg px-3 py-1 font-semibold transition hover:bg-error/10" onClick={clearError} type="button">
            Cerrar
          </button>
        </div>
      )}

      <div className="flex flex-1 gap-6 overflow-x-auto pb-4">
        <KanbanColumn cantidad={pendingAppointments.length} colorTitulo="text-status-pending"
          mensajeVacio="Sin citas pendientes de confirmación" titulo="Por Confirmar">
          {pendingAppointments.map((appointment) => (
            <AppointmentCard appointment={appointment} key={appointment.id}>
              <button className="flex-1 rounded-xl bg-status-confirmed px-4 py-2 text-sm font-semibold text-[#181313] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                disabled={isProcessingAppointment(appointment.id)} onClick={() => handleAppointmentAction(
                  () => confirmAppointment(appointment.id)
                )} type="button">
                Confirmar cita
              </button>
              <button className="flex-1 rounded-xl border border-error/40 px-4 py-2 text-sm font-semibold text-error transition hover:bg-error hover:text-white disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                disabled={isProcessingAppointment(appointment.id)} onClick={() => openCancellation(appointment)} type="button">
                Cancelar
              </button>
            </AppointmentCard>
          ))}
        </KanbanColumn>

        <KanbanColumn cantidad={confirmedAppointments.length} colorTitulo="text-status-confirmed"
          mensajeVacio="No hay citas listas para pasar a cabina hoy" titulo="Confirmadas Hoy">
          {confirmedAppointments.map((appointment) => (
            <AppointmentCard appointment={appointment} key={appointment.id}>
              <button className="w-full rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-surface shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                disabled={isProcessingAppointment(appointment.id)} onClick={() => handleAppointmentAction(
                  () => moveAppointmentToCabin(appointment.id)
                )} type="button">
                Pasar a cabina
              </button>
              <button className="w-full rounded-xl px-4 py-2 text-sm font-semibold text-muted transition hover:bg-error/10 hover:text-error disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                disabled={isProcessingAppointment(appointment.id)} onClick={() => openCancellation(appointment)} type="button">
                Cancelar
              </button>
            </AppointmentCard>
          ))}
        </KanbanColumn>

        <KanbanColumn cantidad={inCabinAppointments.length} colorTitulo="text-status-incabin"
          mensajeVacio="Ninguna clienta atendiéndose en este momento" titulo="En Cabina">
          {inCabinAppointments.map((appointment) => (
            <AppointmentCard appointment={appointment} key={appointment.id}>
              <button className="w-full rounded-xl bg-status-completed px-4 py-2 text-sm font-semibold text-surface shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isProcessingAppointment(appointment.id)}
                onClick={() => handleMoveToCheckout(appointment.id)} type="button">
                Ir a cobrar
              </button>
            </AppointmentCard>
          ))}
        </KanbanColumn>

        <KanbanColumn cantidad={checkoutAppointments.length} colorTitulo="text-secondary"
          mensajeVacio="No hay citas pendientes de cobro" titulo="Por Cobrar">
          {checkoutAppointments.map((appointment) => (
            <AppointmentCard appointment={appointment} key={appointment.id}>
              <button className="w-full rounded-xl bg-secondary px-4 py-2 text-sm font-semibold text-surface shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isProcessingAppointment(appointment.id)}
                onClick={() => openCheckout(appointment.id)} type="button">
                Abrir cobro
              </button>
            </AppointmentCard>
          ))}
        </KanbanColumn>
      </div>

      <CancelAppointmentModal appointment={selectedAppointment}
        canCancel={Boolean(selectedAppointment?.canCancel)} error={error}
        isSubmitting={isProcessingAppointment(selectedAppointment?.id)}
        key={selectedAppointment?.id ?? 'closed'} onClose={closeCancellation}
        onConfirm={confirmCancellation} />
    </div>
  );
}
