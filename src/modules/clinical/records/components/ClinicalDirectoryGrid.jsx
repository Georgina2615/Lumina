import ClinicalDirectoryCard from './ClinicalDirectoryCard';

// Presenta los resultados reales del directorio
export default function ClinicalDirectoryGrid({ entries, isLoading, onOpen }) {
  if (isLoading) {
    return (
      <div aria-label="Cargando expedientes" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" role="status">
        {[0, 1, 2].map((item) => (
          <div className="h-64 animate-pulse rounded-2xl border border-surface-hover bg-surface" key={item} />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-surface-hover bg-surface/60 px-5 py-12 text-center">
        <h2 className="text-xl text-primary">No encontramos clientas</h2>
        <p className="mt-1 text-sm text-muted">Prueba con otra parte del nombre teléfono o correo</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {entries.map((entry) => (
        <ClinicalDirectoryCard entry={entry} key={entry.client.id} onOpen={onOpen} />
      ))}
    </div>
  );
}
