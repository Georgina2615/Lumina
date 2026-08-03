// Define los periodos disponibles para la consulta
const reportPeriods = [
  { id: 'today', label: 'Hoy' },
  { id: 'lastSevenDays', label: 'Últimos siete días' },
  { id: 'currentMonth', label: 'Este mes' }
];

// Permite elegir el periodo visible del reporte
export default function ReportPeriodSelector({
  disabled = false,
  onChange,
  periodId
}) {
  // Presenta opciones accesibles como un solo control
  return (
    <section
      aria-labelledby="report-period-title"
      className="rounded-2xl border border-surface-hover bg-surface p-4 shadow-sm"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2
            className="text-lg font-semibold text-primary"
            id="report-period-title"
          >
            Periodo del reporte
          </h2>
          <p className="mt-1 text-xs text-muted">
            Elige las fechas que quieres revisar
          </p>
        </div>

        <div
          aria-label="Seleccionar periodo"
          className="grid grid-cols-3 rounded-xl border border-surface-hover bg-background p-1"
          role="group"
        >
          {reportPeriods.map((period) => {
            // Identifica el periodo seleccionado
            const isSelected = period.id === periodId;

            // Devuelve cada periodo con su estado visible
            return (
              <button
                aria-pressed={isSelected}
                className={`min-h-10 rounded-lg px-3 text-xs font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40 sm:text-sm ${
                  isSelected
                    ? 'bg-primary text-surface shadow-sm'
                    : 'text-muted hover:bg-surface hover:text-primary'
                }`}
                disabled={disabled}
                key={period.id}
                onClick={() => onChange(period.id)}
                type="button"
              >
                {period.label}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
