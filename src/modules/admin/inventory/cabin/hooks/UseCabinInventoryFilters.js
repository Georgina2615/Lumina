import { useMemo, useState } from 'react';

const normalizeSearch = (value) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim();

// Aplica búsqueda y filtros sobre la fotografía local
export const useCabinInventoryFilters = (supplies) => {
  const [activityFilter, setActivityFilter] = useState('active');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [unitFilter, setUnitFilter] = useState('all');

  const categories = useMemo(() => (
    [...new Set(supplies.map((supply) => supply.category))]
      .sort((first, second) => first.localeCompare(second, 'es'))
  ), [supplies]);

  const filteredSupplies = useMemo(() => {
    const normalizedSearch = normalizeSearch(search);

    return supplies.filter((supply) => {
      const searchableValue = normalizeSearch([
        supply.name,
        supply.brand,
        supply.category
      ].join(' '));
      const matchesSearch = !normalizedSearch
        || searchableValue.includes(normalizedSearch);
      const matchesActivity = activityFilter === 'all'
        || (activityFilter === 'active' && supply.active)
        || (activityFilter === 'inactive' && !supply.active);
      const matchesCategory = categoryFilter === 'all'
        || supply.category === categoryFilter;
      const matchesUnit = unitFilter === 'all' || supply.unit === unitFilter;
      const matchesStock = stockFilter === 'all'
        || (stockFilter === 'sold_out' && supply.stockScaled === 0)
        || (
          stockFilter === 'low'
          && supply.stockScaled > 0
          && supply.stockScaled <= supply.minimumStockScaled
        )
        || (
          stockFilter === 'healthy'
          && supply.stockScaled > supply.minimumStockScaled
        );

      return matchesSearch
        && matchesActivity
        && matchesCategory
        && matchesUnit
        && matchesStock;
    });
  }, [
    activityFilter,
    categoryFilter,
    search,
    stockFilter,
    supplies,
    unitFilter
  ]);

  // Restablece la vista operativa principal
  const resetFilters = () => {
    setActivityFilter('active');
    setCategoryFilter('all');
    setSearch('');
    setStockFilter('all');
    setUnitFilter('all');
  };

  // Expone filtros controlados y resultados derivados
  return {
    activityFilter,
    categories,
    categoryFilter,
    filteredSupplies,
    resetFilters,
    search,
    setActivityFilter,
    setCategoryFilter,
    setSearch,
    setStockFilter,
    setUnitFilter,
    stockFilter,
    unitFilter
  };
};
