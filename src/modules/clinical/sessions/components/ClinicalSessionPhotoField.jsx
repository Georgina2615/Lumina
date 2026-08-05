import { FiCamera, FiUploadCloud } from 'react-icons/fi';
import ClinicalPrivatePhoto from './ClinicalPrivatePhoto';

// Permite seleccionar una fotografía clínica privada
export default function ClinicalSessionPhotoField({
  existingPath,
  kind,
  label,
  onSelect,
  preview
}) {
  const inputId = `clinical-photo-${kind}`;

  return (
    <div className="rounded-2xl border border-surface-hover bg-background p-3">
      <div className="aspect-[4/3] overflow-hidden rounded-xl bg-surface-hover/40">
        {preview ? (
          <img alt={`Vista previa ${label.toLowerCase()}`} className="h-full w-full object-cover" src={preview} />
        ) : existingPath ? (
          <ClinicalPrivatePhoto alt={label} className="h-full w-full" imagePath={existingPath} />
        ) : (
          <div className="grid h-full place-items-center text-muted"><FiCamera aria-hidden="true" className="text-3xl" /></div>
        )}
      </div>
      <label className="mt-3 inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-surface-hover bg-surface px-3 text-sm font-semibold text-primary transition hover:border-secondary/30" htmlFor={inputId}>
        <FiUploadCloud aria-hidden="true" />
        {preview || existingPath ? `Cambiar ${label.toLowerCase()}` : `Seleccionar ${label.toLowerCase()}`}
      </label>
      <input
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        id={inputId}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onSelect(kind, file);
          event.target.value = '';
        }}
        type="file"
      />
    </div>
  );
}
