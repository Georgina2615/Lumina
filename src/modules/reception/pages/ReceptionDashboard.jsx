import { useReceptionKanban } from '../hooks';
import { AppointmentCard } from '../../common/components';
import { KanbanColumn } from '../components'; // ¡Nuestra nueva importación limpia!

export default function ReceptionDashboard() {
  const { citasPorConfirmar, citasConfirmadas, citasEnCabina, cargando, actualizarEstadoCita } = useReceptionKanban();

  const handleAprobarPago = async (id) => await actualizarEstadoCita(id, "confirmada");
  const handleCancelarCita = async (id) => await actualizarEstadoCita(id, "cancelada");
  const handlePasarCabina = async (id) => await actualizarEstadoCita(id, "en_cabina");
  const handleIrACobrar = async (id) => await actualizarEstadoCita(id, "completada"); 

  if (cargando) {
    return (
      <div className="h-full flex items-center justify-center text-muted font-body">
        Cargando el tablero...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-6">
      
      <div>
        <h1 className="text-3xl font-title font-bold text-primary">Panel de Recepción</h1>
        <p className="text-muted font-body mt-1">Control de citas en tiempo real</p>
      </div>

      <div className="flex-1 flex gap-6 overflow-x-auto pb-4">
        
        {/* COLUMNA A: POR CONFIRMAR */}
        <KanbanColumn 
          titulo="Por Confirmar" colorTitulo="text-status-pending"
          cantidad={citasPorConfirmar.length} mensajeVacio="Sin citas pendientes de pago."
        >
          {citasPorConfirmar.map(cita => (
            <AppointmentCard key={cita.id} cita={cita}>
              <button 
                onClick={() => handleAprobarPago(cita.id)}
                className="px-4 py-2 text-sm font-medium bg-status-confirmed text-surface rounded-lg hover:opacity-90 transition-colors shadow-sm flex-1 md:flex-none"
              >
                Aprobar Pago
              </button>
              <button 
                onClick={() => handleCancelarCita(cita.id)}
                className="px-4 py-2 text-sm font-medium border border-error text-error rounded-lg hover:bg-error hover:text-surface transition-colors shadow-sm flex-1 md:flex-none"
              >
                Cancelar
              </button>
            </AppointmentCard>
          ))}
        </KanbanColumn>

        {/* COLUMNA B: CONFIRMADAS */}
        <KanbanColumn 
          titulo="Confirmadas (Hoy)" colorTitulo="text-status-confirmed"
          cantidad={citasConfirmadas.length} mensajeVacio="No hay citas listas para pasar a cabina hoy."
        >
          {citasConfirmadas.map(cita => (
            <AppointmentCard key={cita.id} cita={cita}>
              <button 
                onClick={() => handlePasarCabina(cita.id)}
                className="px-4 py-2 text-sm font-medium bg-primary text-surface rounded-lg hover:opacity-90 transition-colors shadow-sm w-full md:w-auto"
              >
                Pasar a Cabina
              </button>
              <button 
                onClick={() => handleCancelarCita(cita.id)}
                className="px-4 py-2 text-sm font-medium text-muted hover:text-error transition-colors w-full md:w-auto mt-2 md:mt-0"
              >
                Cancelar
              </button>
            </AppointmentCard>
          ))}
        </KanbanColumn>

        {/* COLUMNA C: EN CABINA */}
        <KanbanColumn 
          titulo="En Cabina" colorTitulo="text-status-incabin"
          cantidad={citasEnCabina.length} mensajeVacio="Ninguna clienta atendiéndose en este momento."
        >
          {citasEnCabina.map(cita => (
            <AppointmentCard key={cita.id} cita={cita}>
              <button 
                onClick={() => handleIrACobrar(cita.id)}
                className="px-4 py-2 text-sm font-medium bg-status-completed text-surface rounded-lg hover:opacity-90 transition-colors shadow-sm w-full"
              >
                Ir a Cobrar
              </button>
            </AppointmentCard>
          ))}
        </KanbanColumn>

      </div>
    </div>
  );
}