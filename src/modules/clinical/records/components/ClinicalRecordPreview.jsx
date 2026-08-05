import { FiCheckCircle, FiPhone, FiX } from 'react-icons/fi';
import { useAccessibleDialog } from '../../../../shared/hooks';
import { createClinicalRecordForm } from '../services/ClinicalRecordPolicy';
import ClinicalRecordForm from './ClinicalRecordForm';
import ClinicalSessionHistory from '../../sessions/components/ClinicalSessionHistory';
import ClinicalConsentHistory from '../../consents/components/ClinicalConsentHistory';

// Presenta una ficha completa sin permitir cambios fuera de cabina
export default function ClinicalRecordPreview({ entry, onClose }) {
  const dialogRef = useAccessibleDialog({
    focusKey: entry?.client.id,
    isOpen: Boolean(entry),
    onRequestClose: onClose
  });

  if (!entry) return null;

  const { client, record, revision, status } = entry;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-primary/35 p-0 backdrop-blur-sm sm:items-center sm:p-5"
      onMouseDown={(event) => event.currentTarget === event.target && onClose()}
      role="presentation"
    >
      <section
        aria-labelledby="clinical-preview-title"
        aria-modal="true"
        className="max-h-[96dvh] w-full max-w-6xl overflow-y-auto rounded-t-3xl border border-surface-hover bg-background shadow-2xl sm:rounded-3xl"
        ref={dialogRef}
        role="dialog"
        tabIndex="-1"
      >
        <header className="sticky top-0 z-20 flex items-start justify-between gap-4 border-b border-surface-hover bg-background/95 px-5 py-4 backdrop-blur sm:px-7">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-secondary">Expediente clínico</p>
            <h1 className="mt-1 text-2xl text-primary sm:text-3xl" id="clinical-preview-title">{client.name}</h1>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
              <span className="inline-flex items-center gap-1.5"><FiPhone aria-hidden="true" />{client.phone || 'Sin teléfono'}</span>
              <span className="inline-flex items-center gap-1.5"><FiCheckCircle aria-hidden="true" />Firma general {client.consentSigned ? 'registrada' : 'pendiente'}</span>
            </div>
          </div>
          <button aria-label="Cerrar expediente" className="grid size-11 shrink-0 place-items-center rounded-xl text-muted transition hover:bg-surface-hover hover:text-primary" data-dialog-initial-focus onClick={onClose} type="button">
            <FiX aria-hidden="true" />
          </button>
        </header>

        <div className="p-4 sm:p-7">
          {status === 'missing' ? (
            <div className="rounded-2xl border border-dashed border-surface-hover bg-surface px-5 py-12 text-center">
              <h2 className="text-xl text-primary">Aún no tiene ficha técnica</h2>
              <p className="mx-auto mt-2 max-w-lg text-sm text-muted">La ficha podrá crearse cuando esta clienta se encuentre en cabina durante una cita</p>
            </div>
          ) : (
            <ClinicalRecordForm
              initialRecord={createClinicalRecordForm(record)}
              initialStatus={status}
              key={`${client.id}-${revision}`}
              readOnly
            />
          )}
          <ClinicalSessionHistory sessions={entry.sessions} />
          <ClinicalConsentHistory consents={entry.consents ?? []} />
        </div>
      </section>
    </div>
  );
}
