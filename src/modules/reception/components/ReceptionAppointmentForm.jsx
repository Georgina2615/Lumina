import { useState } from "react";
import { useReceptionAppointments } from "../hooks"; 
import { ReceptionClientSection, ReceptionDetailsSection } from ".";

export default function ReceptionAppointmentForm({ onClose }) {
  const { agendarCitaPresencial, buscarCliente, cargando, errorLocal, exito } = useReceptionAppointments();
  
  const [terminoBusqueda, setTerminoBusqueda] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [datosCliente, setDatosCliente] = useState({ nombreCompleto: "", telefono: "", email: "", id: null });
  const [datosCita, setDatosCita] = useState({ fecha: "", hora: "", servicio: "" });

  // Trigger de búsqueda onBlur corregido
  const manejarBusqueda = async () => {
    if (terminoBusqueda.length < 4) return; 
    setBuscando(true);
    
    // Recuerda: La búsqueda es exacta. Se recomienda buscar por los 10 dígitos del teléfono.
    const clienteEncontrado = await buscarCliente(terminoBusqueda);
    
    if (clienteEncontrado) {
      setDatosCliente(clienteEncontrado);
    } else {
      setTerminoBusqueda(""); // Limpiamos la barra
      setDatosCliente({ nombreCompleto: "", telefono: "", email: "", id: null });
    }
    setBuscando(false);
  };

  const manejarCambioCliente = (e) => setDatosCliente({ ...datosCliente, [e.target.name]: e.target.value });
  const manejarCambioCita = (e) => setDatosCita({ ...datosCita, [e.target.name]: e.target.value });

  const manejarEnvio = async (e) => {
    e.preventDefault();
    await agendarCitaPresencial(datosCliente, datosCita);
  };

  if (exito) {
    return (
      <div className="p-8 text-center bg-surface rounded-2xl border border-surface-hover">
        <h2 className="text-2xl font-title font-bold text-status-confirmed mb-4">¡Cita Agendada!</h2>
        <p className="text-muted font-body mb-6">Cita de <strong>{datosCliente.nombreCompleto}</strong> confirmada.</p>
        <button onClick={onClose} className="bg-primary text-surface px-6 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity">
          Cerrar
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={manejarEnvio} className="bg-surface p-6 rounded-2xl border border-surface-hover flex flex-col gap-6">
      
      <ReceptionClientSection 
        terminoBusqueda={terminoBusqueda}
        setTerminoBusqueda={setTerminoBusqueda}
        manejarBusqueda={manejarBusqueda}
        buscando={buscando}
        datosCliente={datosCliente}
        manejarCambioCliente={manejarCambioCliente}
      />

      <ReceptionDetailsSection 
        datosCita={datosCita}
        manejarCambioCita={manejarCambioCita}
      />

      {errorLocal && <div className="p-3 bg-error/10 text-error rounded-lg text-sm">{errorLocal}</div>}

      <button type="submit" disabled={cargando} className={`w-full py-4 rounded-xl font-medium text-lg shadow-sm transition-all ${cargando ? "bg-surface-hover text-muted cursor-not-allowed" : "bg-primary text-surface hover:opacity-90"}`}>
        {cargando ? "Guardando..." : "Agendar y Confirmar"}
      </button>
    </form>
  );
}