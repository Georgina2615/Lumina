import { useEffect, useMemo, useState } from 'react';
import { filterClinicalDirectory } from '../services/ClinicalDirectoryPolicy';
import { subscribeClinicalDirectory } from '../services/ClinicalDirectoryQueryService';

// Coordina la búsqueda y selección del directorio clínico
export const useClinicalDirectory = () => {
  const [entries, setEntries] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedEntry, setSelectedEntry] = useState(null);

  // Mantiene los expedientes sincronizados
  useEffect(() => subscribeClinicalDirectory({
    onData: (nextEntries) => {
      setEntries(nextEntries);
      setError('');
      setIsLoading(false);
      setSelectedEntry((current) => (
        current
          ? nextEntries.find(({ client }) => client.id === current.client.id)
            ?? null
          : null
      ));
    },
    onError: (subscriptionError) => {
      console.error('Error al sincronizar los expedientes clínicos', subscriptionError);
      setError('No pudimos cargar los expedientes');
      setIsLoading(false);
    }
  }), []);

  const filteredEntries = useMemo(
    () => filterClinicalDirectory(entries, search),
    [entries, search]
  );

  return {
    closePreview: () => setSelectedEntry(null),
    entries: filteredEntries,
    error,
    isLoading,
    openPreview: setSelectedEntry,
    search,
    selectedEntry,
    setSearch,
    total: entries.length
  };
};
