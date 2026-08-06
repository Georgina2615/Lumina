import { useCallback, useEffect, useState } from 'react';
import { loadPublicServices } from '../services/PublicServiceCatalogService';

// Controla la consulta publica de servicios
export const usePublicServices = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Repite la consulta cuando la visitante lo solicita
  const reload = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const currentServices = await loadPublicServices();
      setServices(currentServices);
    } catch (loadError) {
      console.error('Error al cargar los servicios públicos', loadError);
      setError('No pudimos mostrar los servicios en este momento');
    } finally {
      setLoading(false);
    }
  }, []);

  // Ejecuta la consulta al abrir la pagina
  useEffect(() => {
    let isActive = true;

    loadPublicServices()
      .then((currentServices) => {
        // Ignora respuestas posteriores al desmontaje
        if (isActive) {
          setServices(currentServices);
        }
      })
      .catch((loadError) => {
        console.error('Error al cargar los servicios públicos', loadError);

        // Conserva un mensaje seguro para la visitante
        if (isActive) {
          setError('No pudimos mostrar los servicios en este momento');
        }
      })
      .finally(() => {
        // Finaliza solo la consulta vigente
        if (isActive) {
          setLoading(false);
        }
      });

    // Cancela actualizaciones cuando la pagina se desmonta
    return () => {
      isActive = false;
    };
  }, []);

  // Expone el estado necesario para la vista
  return { error, loading, reload, services };
};
