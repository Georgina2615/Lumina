import { forwardRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';

// Presenta el lienzo privado de firma
const ClinicalConsentSignature = forwardRef(function ClinicalConsentSignature(
  { disabled, onClear },
  ref
) {
  return (
    <section className="rounded-2xl border border-surface-hover bg-surface p-4 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl text-primary">Firma de la clienta</h2>
          <p className="mt-1 text-sm text-muted">Firma dentro del recuadro después de leer el documento</p>
        </div>
        <button className="min-h-10 rounded-xl border border-surface-hover px-4 text-sm font-semibold text-primary transition hover:bg-surface-hover disabled:opacity-50" disabled={disabled} onClick={onClear} type="button">Limpiar</button>
      </div>
      <div className="mt-4 overflow-hidden rounded-xl border-2 border-dashed border-surface-hover bg-white">
        <SignatureCanvas
          canvasProps={{ className: 'h-52 w-full touch-none cursor-crosshair' }}
          penColor="#2A2121"
          ref={ref}
        />
      </div>
    </section>
  );
});

export default ClinicalConsentSignature;
