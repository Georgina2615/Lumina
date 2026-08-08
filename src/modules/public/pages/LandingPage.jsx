import {
  PublicExperienceSection,
  PublicHero,
  PublicServicesSection
} from '../components';
import { usePublicServices } from '../hooks/UsePublicServices';

// Compone la pagina principal publica
export default function LandingPage() {
  const catalog = usePublicServices();

  // Devuelve la experiencia publica completa
  return (
    <>
      <PublicHero />
      <PublicExperienceSection />
      <PublicServicesSection
        error={catalog.error}
        loading={catalog.loading}
        onRetry={catalog.reload}
        services={catalog.services.slice(0, 3)}
        showAllLink
      />
    </>
  );
}
