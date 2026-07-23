import { useState, useEffect } from 'react';
import { useClients } from '../hooks';

export default function ClientProfileModal({ isOpen, onClose, cliente }) {
  const { actualizarContacto } = useClients();
  
  // Estados para los campos editables
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [guardando, setGuardando] = useState(false);

  // Sincronizamos los datos del cliente al abrir el modal
  useEffect(() => {
    if (cliente) {
      setTelefono(cliente.telefono || '');
      setEmail(cliente.email || '');
    }
  }, [cliente]);

  if (!isOpen || !cliente) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      await actualizarContacto(cliente.id, { telefono, email });
      onClose(); // Cerramos al terminar
    } catch (error) {
      alert("Hubo un error al actualizar los datos.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-sm">
      <div className="bg-background rounded-2xl max-w-md w-full p-6 shadow-xl">
        
        <div className="flex justify-between items-center mb-6 border-b border-surface-hover pb-3">
          <h2 className="font-title font-bold text-xl text-primary">Perfil del Cliente</h2>
          <button onClick={onClose} className="text-muted hover:text-error text-xl font-bold">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {/* CAMPO BLOQUEADO (Solo lectura) */}
          <div>
            <label className="text-xs font-semibold text-muted mb-1 block">Nombre Completo (No editable)</label>
            <input 
              type="text" 
              value={cliente.nombreCompleto} 
              disabled 
              className="w-full p-3 rounded-xl border border-surface-hover bg-surface-hover text-muted cursor-not-allowed" 
            />
          </div>

          {/* CAMPOS EDITABLES */}
          <div>
            <label className="text-xs font-semibold text-muted mb-1 block">Teléfono *</label>
            <input 
              type="tel" 
              required
              value={telefono} 
              onChange={(e) => setTelefono(e.target.value)}
              className="w-full p-3 rounded-xl border border-surface-hover bg-background text-primary focus:border-primary focus:outline-none transition-colors" 
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted mb-1 block">Correo Electrónico *</label>
            <input 
              type="email" 
              required
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-xl border border-surface-hover bg-background text-primary focus:border-primary focus:outline-none transition-colors" 
            />
          </div>

          {/* ESTADO LEGAL */}
          <div className="mt-2 p-3 rounded-lg bg-surface flex justify-between items-center border border-surface-hover">
            <span className="text-sm font-semibold text-muted">Estatus Legal:</span>
            {cliente.consentimientoFirmado ? (
              <span className="text-xs font-bold text-status-confirmed bg-status-confirmed/10 px-3 py-1 rounded-full">Firma Registrada</span>
            ) : (
              <span className="text-xs font-bold text-error bg-error/10 px-3 py-1 rounded-full">Sin Firma</span>
            )}
          </div>

          <div className="mt-4">
            <button 
              type="submit" 
              disabled={guardando}
              className={`w-full py-3 text-sm font-medium rounded-xl text-surface shadow-sm transition-colors ${
                guardando ? 'bg-surface-hover cursor-not-allowed' : 'bg-primary hover:opacity-90'
              }`}
            >
              {guardando ? "Actualizando..." : "Actualizar Contacto"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}