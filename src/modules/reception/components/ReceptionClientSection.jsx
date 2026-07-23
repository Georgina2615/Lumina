export default function ReceptionClientSection({ 
  terminoBusqueda, 
  setTerminoBusqueda, 
  manejarBusqueda, 
  buscando, 
  datosCliente, 
  manejarCambioCliente 
}) {
  return (
    <div>
      <h3 className="font-title font-semibold text-lg text-primary mb-3">Datos del Cliente</h3>
      <div className="flex flex-col gap-4">
        
        {/* Buscador */}
        <div className="relative">
          <label className="text-xs font-semibold text-muted mb-1 block">Buscar por Teléfono, Nombre o Correo</label>
          <input 
            type="text" 
            placeholder="Ej. 5551234567, María López o correo@ejemplo.com"
            value={terminoBusqueda}
            onChange={(e) => setTerminoBusqueda(e.target.value)}
            onBlur={manejarBusqueda}
            className="w-full p-3 rounded-xl border border-surface-hover bg-background focus:outline-none focus:border-primary transition-colors"
          />
          {buscando && <span className="absolute right-3 top-9 text-xs text-status-pending">Buscando...</span>}
        </div>

        {/* Campos del cliente */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-muted mb-1 block">Nombre Completo *</label>
            <input required type="text" name="nombreCompleto" value={datosCliente.nombreCompleto} onChange={manejarCambioCliente} className="w-full p-3 rounded-xl border border-surface-hover bg-background" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted mb-1 block">Teléfono *</label>
            <input required type="tel" name="telefono" value={datosCliente.telefono} onChange={manejarCambioCliente} className="w-full p-3 rounded-xl border border-surface-hover bg-background" />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-muted mb-1 block">Correo Electrónico *</label>
            <input required type="email" name="email" value={datosCliente.email} onChange={manejarCambioCliente} className="w-full p-3 rounded-xl border border-surface-hover bg-background" />
          </div>
        </div>
      </div>
    </div>
  );
}