import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { saveAdminCashClose } from '../services/AdminCashCloseCommandService';
import {
  buildAdminCashCloseRequest,
  calculateCashClosePreview,
  formatCashCloseInput,
  getPreviousBusinessDateKey
} from '../services/AdminCashClosePolicy';
import {
  loadAdminCashCloseDay,
  loadRecentAdminCashCloses
} from '../services/AdminCashCloseQueryService';

const emptyForm = {
  openingCash: '0.00',
  withdrawals: '0.00',
  countedCash: '0.00',
  reason: ''
};

// Coordina la consulta y guardado del corte
export const useAdminCashClose = () => {
  const [dateKey, setDateKey] = useState(getPreviousBusinessDateKey);
  const [day, setDay] = useState(null);
  const [history, setHistory] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingRequest, setPendingRequest] = useState(null);
  const requestId = useRef(0);

  const loadData = useCallback(async (selectedDate = dateKey) => {
    const currentRequest = requestId.current + 1;
    requestId.current = currentRequest;
    setIsLoading(true);
    setError('');

    try {
      const [nextDay, nextHistory] = await Promise.all([
        loadAdminCashCloseDay(selectedDate),
        loadRecentAdminCashCloses()
      ]);
      if (requestId.current !== currentRequest) return;
      setDay(nextDay);
      setHistory(nextHistory);
      setForm(nextDay.close ? {
        openingCash: formatCashCloseInput(nextDay.close.openingCashCents),
        withdrawals: formatCashCloseInput(nextDay.close.withdrawalsCents),
        countedCash: formatCashCloseInput(nextDay.close.countedCashCents),
        reason: ''
      } : emptyForm);
    } catch {
      if (requestId.current === currentRequest) {
        setError('No se pudo cargar la información del corte');
      }
    } finally {
      if (requestId.current === currentRequest) setIsLoading(false);
    }
  }, [dateKey]);

  useEffect(() => {
    const currentRequest = requestId.current + 1;
    requestId.current = currentRequest;

    Promise.all([
      loadAdminCashCloseDay(dateKey),
      loadRecentAdminCashCloses()
    ]).then(([nextDay, nextHistory]) => {
      if (requestId.current !== currentRequest) return;
      setDay(nextDay);
      setHistory(nextHistory);
      setForm(nextDay.close ? {
        openingCash: formatCashCloseInput(nextDay.close.openingCashCents),
        withdrawals: formatCashCloseInput(nextDay.close.withdrawalsCents),
        countedCash: formatCashCloseInput(nextDay.close.countedCashCents),
        reason: ''
      } : emptyForm);
    }).catch(() => {
      if (requestId.current === currentRequest) {
        setError('No se pudo cargar la información del corte');
      }
    }).finally(() => {
      if (requestId.current === currentRequest) setIsLoading(false);
    });

    return () => { requestId.current += 1; };
  }, [dateKey]);

  const preview = useMemo(() => calculateCashClosePreview({
    form,
    paymentTotals: day?.paymentTotals
  }), [day?.paymentTotals, form]);

  const changeDate = (nextDate) => {
    setIsLoading(true);
    setError('');
    setDateKey(nextDate);
    setSuccess('');
  };

  const changeField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError('');
    setSuccess('');
  };

  const prepareSave = () => {
    if (day?.warningCount > 0) {
      setError('Hay cobros que necesitan revisión antes de guardar el corte');
      return;
    }
    try {
      setPendingRequest(buildAdminCashCloseRequest({
        close: day?.close,
        dateKey,
        form
      }));
    } catch (validationError) {
      setError(validationError.message);
    }
  };

  const confirmSave = async () => {
    if (!pendingRequest) return;
    setIsSaving(true);
    setError('');
    try {
      await saveAdminCashClose(pendingRequest);
      setPendingRequest(null);
      setSuccess(day?.close ? 'Corrección guardada' : 'Corte guardado');
      await loadData(dateKey);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    cancelSave: () => setPendingRequest(null),
    changeDate,
    changeField,
    confirmSave,
    dateKey,
    day,
    error,
    form,
    history,
    isLoading,
    isSaving,
    maxDate: getPreviousBusinessDateKey(),
    pendingRequest,
    prepareSave,
    preview,
    refresh: () => loadData(dateKey),
    success
  };
};
