import { useMemo, useState } from 'react';

const normalizeSearch = (value) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim();

// Aplica búsqueda y filtros sobre la fotografía local
export const useRetailInventoryFilters = (products) => {
  const [activityFilter, setActivityFilter] = useState('active');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState('all');

  const categories = useMemo(() => (
    [...new Set(products.map((product) => product.category))]
      .sort((first, second) => first.localeCompare(second, 'es'))
  ), [products]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = normalizeSearch(search);

    return products.filter((product) => {
      const searchableValue = normalizeSearch([
        product.name,
        product.brand,
        product.sku,
        product.category
      ].join(' '));
      const matchesSearch = !normalizedSearch
        || searchableValue.includes(normalizedSearch);
      const matchesActivity = activityFilter === 'all'
        || (activityFilter === 'active' && product.active)
        || (activityFilter === 'inactive' && !product.active);
      const matchesCategory = categoryFilter === 'all'
        || product.category === categoryFilter;
      const matchesStock = stockFilter === 'all'
        || (stockFilter === 'sold_out' && product.stock === 0)
        || (
          stockFilter === 'low'
          && product.stock > 0
          && product.stock <= product.minimumStock
        )
        || (
          stockFilter === 'healthy'
          && product.stock > product.minimumStock
        );

      return matchesSearch
        && matchesActivity
        && matchesCategory
        && matchesStock;
    });
  }, [activityFilter, categoryFilter, products, search, stockFilter]);

  // Restablece la vista operativa principal
  const resetFilters = () => {
    setActivityFilter('active');
    setCategoryFilter('all');
    setSearch('');
    setStockFilter('all');
  };

  // Expone filtros controlados y resultados derivados
  return {
    activityFilter,
    categories,
    categoryFilter,
    filteredProducts,
    resetFilters,
    search,
    setActivityFilter,
    setCategoryFilter,
    setSearch,
    setStockFilter,
    stockFilter
  };
};
