export default function ReceptionDetailsSection({ datosCita, manejarCambioCita }) {
  return (
    <div className="border-t border-surface-hover pt-4">
      <h3 className="font-title font-semibold text-lg text-primary mb-3">Detalles de la Cita</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="text-xs font-semibold text-muted mb-1 block">Servicio *</label>
          <select required name="servicio" value={datosCita.servicio} onChange={manejarCambioCita} className="w-full p-3 rounded-xl border border-surface-hover bg-background text-primary">
            <option value="">Selecciona un tratamiento...</option>
            {/* Opciones estrictas de negocio */}
            <option value="Limpieza facial profunda">Limpieza facial profunda</option>
            <option value="Limpieza facial basica">Limpieza facial básica</option>
            <option value="Anti acne">Anti acné</option>
            <option value="Despigmentante">Despigmentante</option>
            <option value="Anti edad">Anti edad</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted mb-1 block">Fecha *</label>
          <input required type="date" name="fecha" value={datosCita.fecha} onChange={manejarCambioCita} className="w-full p-3 rounded-xl border border-surface-hover bg-background text-primary" />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted mb-1 block">Hora *</label>
          <select required name="hora" value={datosCita.hora} onChange={manejarCambioCita} className="w-full p-3 rounded-xl border border-surface-hover bg-background text-primary">
            <option value="">Selecciona un horario...</option>
            <option value="10:00">10:00 AM - 1:00 PM</option>
            <option value="14:00">2:00 PM - 5:00 PM</option>
            <option value="17:00">5:00 PM - 8:00 PM</option>
          </select>
        </div>
      </div>
    </div>
  );
}