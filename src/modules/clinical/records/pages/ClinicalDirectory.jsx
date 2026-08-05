import { SearchBar } from '../../../../shared/components';
import ClinicalDirectoryGrid from '../components/ClinicalDirectoryGrid';
import ClinicalRecordPreview from '../components/ClinicalRecordPreview';
import { useClinicalDirectory } from '../hooks/UseClinicalDirectory';

// Presenta la búsqueda y consulta de expedientes clínicos
export default function ClinicalDirectory() {
  const directory = useClinicalDirectory();

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-6">
      <header>
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.22em] text-secondary">Cabina</p>
        <h1 className="text-3xl text-primary sm:text-4xl">Expedientes</h1>
        <p className="mt-1 text-sm text-muted sm:text-base">Consulta las fichas técnicas de las clientas</p>
      </header>

      <section aria-label="Buscar expedientes" className="rounded-2xl border border-surface-hover bg-surface p-4 shadow-sm">
        <SearchBar
          ariaLabel="Buscar clienta"
          onChange={(event) => directory.setSearch(event.target.value)}
          placeholder="Buscar por nombre teléfono o correo"
          value={directory.search}
        />
        <p aria-live="polite" className="mt-2 text-xs text-muted">
          {directory.isLoading ? 'Cargando clientas' : `${directory.entries.length} de ${directory.total} clientas`}
        </p>
      </section>

      {directory.error && (
        <div className="rounded-2xl border border-error/20 bg-error/10 px-4 py-3 text-sm font-medium text-error" role="alert">
          {directory.error}
        </div>
      )}

      {!directory.error && (
        <ClinicalDirectoryGrid entries={directory.entries} isLoading={directory.isLoading} onOpen={directory.openPreview} />
      )}

      <ClinicalRecordPreview entry={directory.selectedEntry} onClose={directory.closePreview} />
    </div>
  );
}
