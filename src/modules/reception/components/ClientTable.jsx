import { useState } from 'react';
import { FiSearch, FiEdit2 } from 'react-icons/fi';

export default function ClientTable({ clientes, onOpenProfile, onOpenSignature }) {
  const [busqueda, setBusqueda] = useState('');

  // Buscador en tiempo real 
  const clientesFiltrados = clientes.filter(cliente => {
    const termino = busqueda.toLowerCase();
    return (
      (cliente.nombreCompleto?.toLowerCase().includes(termino)) ||
      (cliente.telefono?.includes(termino)) ||
      (cliente.email?.toLowerCase().includes(termino))
    );
  });

  return (
    <div className="bg-surface rounded-2xl border border-surface-hover shadow-sm overflow-hidden flex flex-col h-full">
      
      {/* Barra de Búsqueda */}
      <div className="p-4 border-b border-surface-hover bg-background/50">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="text-muted" />
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre, teléfono o correo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 p-3 rounded-xl border border-surface-hover bg-surface focus:outline-none focus:border-primary transition-colors text-sm"
          />
        </div>
      </div>

      {/* Tabla Responsiva */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-hover/50 text-muted text-xs uppercase tracking-wider">
              <th className="p-4 font-semibold">Cliente</th>
              <th className="p-4 font-semibold">Contacto</th>
              <th className="p-4 font-semibold text-center">Estatus Legal</th>
              <th className="p-4 font-semibold text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-hover">
            {clientesFiltrados.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-8 text-center text-muted italic">
                  No se encontraron clientes con esos datos.
                </td>
              </tr>
            ) : (
              clientesFiltrados.map((cliente) => (
                <tr key={cliente.id} className="hover:bg-surface-hover/30 transition-colors">
                  
                  {/* Columna Nombre */}
                  <td className="p-4">
                    <p className="font-title font-bold text-primary">{cliente.nombreCompleto}</p>
                    <p className="text-xs text-muted">
                      Registrada: {cliente.fechaRegistro?.toDate().toLocaleDateString('es-MX') || 'Reciente'}
                    </p>
                  </td>

                  {/* Columna Contacto */}
                  <td className="p-4 text-sm text-secondary">
                    <p>{cliente.telefono}</p>
                    <p className="text-xs text-muted">{cliente.email}</p>
                  </td>

                  {/* Columna Estatus Legal */}
                  <td className="p-4 text-center">
                    {cliente.consentimientoFirmado ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-status-confirmed/10 text-status-confirmed border border-status-confirmed/20">
                        Firmado
                      </span>
                    ) : (
                      <button 
                        onClick={() => onOpenSignature(cliente)}
                        className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold bg-error text-white hover:bg-error/90 transition-colors shadow-sm animate-pulse"
                      >
                        Solicitar Firma
                      </button>
                    )}
                  </td>

                  {/* Columna Acciones */}
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => onOpenProfile(cliente)}
                      className="p-2 rounded-lg text-muted hover:text-primary hover:bg-surface-hover transition-colors inline-flex items-center gap-2 text-sm font-medium"
                      title="Ver y editar perfil"
                    >
                      <FiEdit2 /> Perfil
                    </button>
                  </td>

                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}