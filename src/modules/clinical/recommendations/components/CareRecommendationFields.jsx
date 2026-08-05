// Presenta cuidados y siguiente atención sugerida
export default function CareRecommendationFields({ fields, services, onChange }) {
  return (
    <section className="space-y-5 rounded-2xl border border-surface-hover bg-surface p-4 shadow-sm sm:p-5">
      <div><h2 className="text-xl text-primary">Cuidados recomendados</h2><p className="mt-1 text-sm text-muted">Orientación estética para continuar el cuidado en casa</p></div>
      <label className="block text-sm font-semibold text-primary">
        Cuidados en casa
        <textarea className="mt-2 min-h-36 w-full resize-y rounded-xl border border-surface-hover bg-background p-3 font-normal outline-none transition focus:border-secondary/40 focus:ring-2 focus:ring-secondary/20" maxLength={2000} name="careInstructions" onChange={onChange} placeholder="Describe limpieza hidratación protección solar u otros cuidados estéticos" value={fields.careInstructions} />
        <span className="mt-1 block text-right text-xs font-normal text-muted">{fields.careInstructions.length} de 2000</span>
      </label>
      <label className="block text-sm font-semibold text-primary">
        Siguiente tratamiento sugerido
        <select className="mt-2 min-h-11 w-full rounded-xl border border-surface-hover bg-background px-3 font-normal outline-none focus:border-secondary/40 focus:ring-2 focus:ring-secondary/20" name="serviceId" onChange={onChange} value={fields.serviceId}>
          <option value="">Sin tratamiento sugerido</option>
          {services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
        </select>
      </label>
      <label className="block text-sm font-semibold text-primary">
        Fecha sugerida para volver
        <input className="mt-2 min-h-11 w-full rounded-xl border border-surface-hover bg-background px-3 font-normal outline-none focus:border-secondary/40 focus:ring-2 focus:ring-secondary/20" name="nextVisitDate" onChange={onChange} type="date" value={fields.nextVisitDate} />
      </label>
      <div className="rounded-xl border border-secondary/15 bg-secondary/5 px-4 py-3 text-sm text-muted">Estas recomendaciones son de cuidado estético y no sustituyen una valoración médica</div>
    </section>
  );
}
