import { useReceptionKanban } from '../hooks';
import { AppointmentCard } from '../../common/components';

export default function ReceptionDashboard() {
  // Se extrae la función de actualización real
  const { citasPorConfirmar, citasConfirmadas, citasEnCabina, cargando, actualizarEstadoCita } = useReceptionKanban();

  const handleAprobarPago = async (id) => {
    await actualizarEstadoCita(id, "confirmada");
  };
  
  const handleCancelarCita = async (id) => {
    await actualizarEstadoCita(id, "cancelada");
  };
  
  const handlePasarCabina = async (id) => {
    await actualizarEstadoCita(id, "en_cabina");
  };
  
  const handleIrACobrar = async (id) => {
    await actualizarEstadoCita(id, "completada"); 
  };

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
        <div className="flex-1 min-w-[340px] bg-surface rounded-2xl p-4 flex flex-col border border-surface-hover">
          <h2 className="font-title font-semibold text-lg text-status-pending mb-4 flex items-center justify-between">
            Por Confirmar
            <span className="bg-background text-primary text-xs py-1 px-3 rounded-full shadow-sm">
              {citasPorConfirmar.length}
            </span>
          </h2>
          <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-1">
            {citasPorConfirmar.length === 0 && (
              <p className="text-sm text-muted text-center italic mt-10">Sin citas pendientes de pago.</p>
            )}
            
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
          </div>
        </div>

        {/* COLUMNA B: CONFIRMADAS  */}
        <div className="flex-1 min-w-[340px] bg-surface rounded-2xl p-4 flex flex-col border border-surface-hover">
          <h2 className="font-title font-semibold text-lg text-status-confirmed mb-4 flex items-center justify-between">
            Confirmadas (Hoy)
            <span className="bg-background text-primary text-xs py-1 px-3 rounded-full shadow-sm">
              {citasConfirmadas.length}
            </span>
          </h2>
          <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-1">
            {citasConfirmadas.length === 0 && (
              <p className="text-sm text-muted text-center italic mt-10">No hay citas listas para pasar a cabina hoy.</p>
            )}

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
          </div>
        </div>

        {/* COLUMNA C: EN CABINA (Solo Hoy) */}
        <div className="flex-1 min-w-[340px] bg-surface rounded-2xl p-4 flex flex-col border border-surface-hover">
          <h2 className="font-title font-semibold text-lg text-status-incabin mb-4 flex items-center justify-between">
            En Cabina
            <span className="bg-background text-primary text-xs py-1 px-3 rounded-full shadow-sm">
              {citasEnCabina.length}
            </span>
          </h2>
          <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-1">
            {citasEnCabina.length === 0 && (
              <p className="text-sm text-muted text-center italic mt-10">Ninguna clienta atendiéndose en este momento.</p>
            )}

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
          </div>
        </div>

      </div>
    </div>
  );
}