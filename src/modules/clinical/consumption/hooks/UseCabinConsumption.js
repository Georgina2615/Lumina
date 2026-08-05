import { useCallback, useEffect, useMemo, useState } from 'react';
import { buildCabinConsumptionItems, filterAvailableCabinSupplies } from '../services/CabinConsumptionPolicy';
import {
  createCabinConsumptionOperationId,
  loadCabinConsumption,
  saveCabinConsumption
} from '../services/CabinConsumptionService';

// Controla la selección y registro de insumos
export const useCabinConsumption = ({ appointmentId, clientId }) => {
  const [state, setState] = useState({ data: null, error: '', isLoading: true, isSaving: false, success: '' });
  const [selectedItems, setSelectedItems] = useState([]);
  const [search, setSearch] = useState('');
  const [loadVersion, setLoadVersion] = useState(0);

  useEffect(() => {
    let active = true;
    loadCabinConsumption({ appointmentId, clientId })
      .then((data) => active && setState({ data, error: '', isLoading: false, isSaving: false, success: '' }))
      .catch((error) => active && setState({ data: null, error: error.message, isLoading: false, isSaving: false, success: '' }));
    return () => {
      active = false;
    };
  }, [appointmentId, clientId, loadVersion]);

  const availableSupplies = useMemo(() => filterAvailableCabinSupplies(
    state.data?.supplies.filter((supply) => !selectedItems.some((item) => item.supply.id === supply.id)) ?? [],
    search
  ), [search, selectedItems, state.data]);

  const addSupply = (supply) => setSelectedItems((current) => [...current, { quantity: '', supply }]);
  const removeSupply = (supplyId) => setSelectedItems((current) => current.filter((item) => item.supply.id !== supplyId));
  const changeQuantity = (supplyId, quantity) => setSelectedItems((current) => current.map((item) => (
    item.supply.id === supplyId ? { ...item, quantity } : item
  )));
  const reload = useCallback(() => {
    setState((current) => ({ ...current, error: '', isLoading: true }));
    setLoadVersion((current) => current + 1);
  }, []);

  const save = async () => {
    if (!state.data || state.isSaving) return;
    try {
      const items = buildCabinConsumptionItems(selectedItems);
      setState((current) => ({ ...current, error: '', isSaving: true }));
      const result = await saveCabinConsumption({
        appointmentId,
        clientId,
        items,
        operationId: createCabinConsumptionOperationId()
      });
      setState((current) => ({
        ...current,
        data: { ...current.data, consumption: { items, status: result.status } },
        isSaving: false,
        success: 'Insumos utilizados registrados'
      }));
    } catch (error) {
      setState((current) => ({ ...current, error: error.message, isSaving: false }));
    }
  };

  return { ...state, addSupply, availableSupplies, changeQuantity, reload, removeSupply, save, search, selectedItems, setSearch };
};
