import { useEffect, useState } from 'react';
import { FiImage } from 'react-icons/fi';
import { loadPrivateClinicalPhoto } from '../services/ClinicalSessionImageService';

// Presenta una fotografía privada sin generar enlaces públicos
export default function ClinicalPrivatePhoto({ alt, className = '', imagePath }) {
  const [source, setSource] = useState('');
  const [failed, setFailed] = useState(false);

  // Descarga la imagen con las credenciales vigentes
  useEffect(() => {
    let active = true;
    let objectUrl = '';

    if (!imagePath) {
      return undefined;
    }

    loadPrivateClinicalPhoto(imagePath)
      .then((blob) => {
        if (!active || !blob) return;
        objectUrl = URL.createObjectURL(blob);
        setSource(objectUrl);
        setFailed(false);
      })
      .catch(() => {
        if (active) setFailed(true);
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [imagePath]);

  if (!source) {
    return (
      <div className={`grid place-items-center bg-surface-hover/40 text-muted ${className}`} role={failed ? 'alert' : 'status'}>
        <FiImage aria-hidden="true" className="text-2xl" />
        <span className="sr-only">{failed ? 'No se pudo cargar la fotografía' : 'Cargando fotografía'}</span>
      </div>
    );
  }

  return <img alt={alt} className={`object-cover ${className}`} src={source} />;
}
