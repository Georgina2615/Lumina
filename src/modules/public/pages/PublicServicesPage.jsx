import { PublicServicesSection } from '../components';
import { usePublicServices } from '../hooks/UsePublicServices';

// Compone el catalogo completo de tratamientos
export default function PublicServicesPage() {
  const catalog = usePublicServices();

  // Devuelve los servicios reales en una pantalla propia
  return (
    <PublicServicesSection
      error={catalog.error}
      loading={catalog.loading}
      onRetry={catalog.reload}
      services={catalog.services}
    />
  );
}
