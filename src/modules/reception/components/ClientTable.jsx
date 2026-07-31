import { useMemo, useState } from 'react';
import { FiEdit2, FiSearch } from 'react-icons/fi';

// Convierte la fecha registrada en texto legible
function formatRegistrationDate(value) {
  const date = typeof value?.toDate === 'function' ? value.toDate() : new Date(value);

  // Protege la interfaz ante fechas heredadas incompletas
  if (!value || Number.isNaN(date.getTime())) {
    return 'Reciente';
  }

  return date.toLocaleDateString('es-MX');
}

// Presenta el estado legal y su acción disponible
function LegalStatus({ client, onOpenSignature }) {
  if (client.consentimientoFirmado) {
    return (
      <span className="inline-flex rounded-full border border-status-confirmed/20 bg-status-confirmed/10 px-3 py-1 text-xs font-bold text-status-confirmed">
        Firmado
      </span>
    );
  }

  return (
    <button
      type="button"
      aria-label={`Solicitar firma de ${client.nombreCompleto}`}
      onClick={() => onOpenSignature(client)}
      className="inline-flex min-h-9 items-center justify-center rounded-full bg-error px-4 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-error/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error focus-visible:ring-offset-2 active:scale-[0.98]"
    >
      Solicitar Firma
    </button>
  );
}

// Presenta la acción para consultar el expediente
function ProfileButton({ client, onOpenProfile, fullWidth = false }) {
  return (
    <button
      type="button"
      aria-label={`Ver y editar el perfil de ${client.nombreCompleto}`}
      onClick={() => onOpenProfile(client)}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium text-muted transition hover:bg-surface-hover hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-[0.98] ${fullWidth ? 'w-full' : ''}`}
    >
      <FiEdit2 aria-hidden="true" />
      Perfil
    </button>
  );
}

// Presenta un cliente como tarjeta para pantallas pequeñas
function ClientCard({ client, onOpenProfile, onOpenSignature }) {
  const headingId = `client-${client.id}`;

  return (
    <article aria-labelledby={headingId} className="rounded-xl border border-surface-hover bg-background/40 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id={headingId} className="break-words font-title text-lg font-bold leading-tight text-primary">
            {client.nombreCompleto}
          </h2>
          <p className="mt-1 text-xs text-muted">
            Registrada {formatRegistrationDate(client.fechaRegistro)}
          </p>
        </div>
        <div className="shrink-0">
          <LegalStatus client={client} onOpenSignature={onOpenSignature} />
        </div>
      </div>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted">Teléfono</dt>
          <dd className="mt-1 break-words text-secondary">{client.telefono || 'No registrado'}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted">Correo</dt>
          <dd className="mt-1 break-all text-secondary">{client.email || 'No registrado'}</dd>
        </div>
      </dl>

      <div className="mt-4 border-t border-surface-hover pt-2">
        <ProfileButton client={client} onOpenProfile={onOpenProfile} fullWidth />
      </div>
    </article>
  );
}

// Presenta búsqueda tarjetas y tabla del directorio
export default function ClientTable({ clients, onOpenProfile, onOpenSignature }) {
  const [search, setSearch] = useState('');

  // Filtra por cualquier fragmento visible del contacto
  const filteredClients = useMemo(() => {
    const term = search.trim().toLowerCase();

    return clients.filter((client) => (
      client.nombreCompleto?.toLowerCase().includes(term)
      || client.telefono?.includes(term)
      || client.email?.toLowerCase().includes(term)
    ));
  }, [clients, search]);

  // Compone las variantes adaptable y tabular
  return (
    <section aria-label="Directorio de clientes" className="flex flex-col overflow-hidden rounded-2xl border border-surface-hover bg-surface shadow-sm md:h-full">
      <div className="border-b border-surface-hover bg-background/50 p-4">
        <label htmlFor="client-search" className="sr-only">Buscar clientes</label>
        <div className="relative">
          <FiSearch aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            id="client-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nombre teléfono o correo"
            className="w-full rounded-xl border border-surface-hover bg-surface py-3 pl-10 pr-3 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
          />
        </div>
      </div>

      <p className="sr-only" aria-live="polite">{filteredClients.length} clientes encontrados</p>

      <div className="space-y-3 p-3 md:hidden">
        {filteredClients.length === 0 ? (
          <p className="px-4 py-10 text-center italic text-muted">No se encontraron clientes con esos datos</p>
        ) : filteredClients.map((client) => (
          <ClientCard key={client.id} client={client} onOpenProfile={onOpenProfile} onOpenSignature={onOpenSignature} />
        ))}
      </div>

      <div className="hidden min-h-0 flex-1 overflow-auto md:block">
        <table className="w-full border-collapse text-left">
          <thead className="sticky top-0 z-10 bg-surface-hover text-xs uppercase tracking-wider text-muted">
            <tr>
              <th scope="col" className="p-4 font-semibold">Cliente</th>
              <th scope="col" className="p-4 font-semibold">Contacto</th>
              <th scope="col" className="p-4 text-center font-semibold">Estatus Legal</th>
              <th scope="col" className="p-4 text-center font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-hover">
            {filteredClients.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-8 text-center italic text-muted">No se encontraron clientes con esos datos</td>
              </tr>
            ) : filteredClients.map((client) => (
              <tr key={client.id} className="transition-colors hover:bg-surface-hover/30">
                <td className="p-4">
                  <p className="font-title font-bold text-primary">{client.nombreCompleto}</p>
                  <p className="text-xs text-muted">Registrada {formatRegistrationDate(client.fechaRegistro)}</p>
                </td>
                <td className="p-4 text-sm text-secondary">
                  <p>{client.telefono || 'No registrado'}</p>
                  <p className="max-w-56 break-all text-xs text-muted">{client.email || 'No registrado'}</p>
                </td>
                <td className="p-4 text-center">
                  <LegalStatus client={client} onOpenSignature={onOpenSignature} />
                </td>
                <td className="p-4 text-center">
                  <ProfileButton client={client} onOpenProfile={onOpenProfile} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
