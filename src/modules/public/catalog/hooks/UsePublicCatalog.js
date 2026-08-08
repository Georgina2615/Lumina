import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  filterCatalogProducts,
  getCatalogCategories
} from '../services/PublicCatalogPolicy';
import { loadPublicProductCatalog } from '../services/PublicCatalogService';

// Controla la carga y exploración del catálogo
export const usePublicCatalog = () => {
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Carga productos reales y conserva la recuperación
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setProducts(await loadPublicProductCatalog());
    } catch (loadError) {
      setProducts([]);
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    loadPublicProductCatalog()
      .then((response) => {
        if (active) setProducts(response);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const categories = useMemo(() => getCatalogCategories(products), [products]);
  const visibleProducts = useMemo(
    () => filterCatalogProducts(products, selectedCategory),
    [products, selectedCategory]
  );

  return {
    categories,
    error,
    load,
    loading,
    products,
    selectedCategory,
    setSelectedCategory,
    visibleProducts
  };
};
