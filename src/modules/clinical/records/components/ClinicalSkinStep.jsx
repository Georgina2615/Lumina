import ClinicalSkinDetailsFields from './ClinicalSkinDetailsFields';
import ClinicalSkinSurfaceFields from './ClinicalSkinSurfaceFields';

// Presenta el análisis estético completo
export default function ClinicalSkinStep({ onChange, onToggle, values }) {
  return (
    <div className="space-y-7">
      <div>
        <h2 className="text-xl text-primary">Evaluación estética de la piel</h2>
        <p className="mt-1 text-sm text-muted">Observaciones realizadas durante la sesión</p>
      </div>
      <ClinicalSkinSurfaceFields onChange={onChange} onToggle={onToggle} values={values} />
      <div className="border-t border-surface-hover pt-6">
        <ClinicalSkinDetailsFields onChange={onChange} onToggle={onToggle} values={values} />
      </div>
    </div>
  );
}
