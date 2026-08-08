import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  loadAdminInvoiceRequests,
  updateAdminInvoiceRequest
} from '../services/AdminInvoiceService';
import {
  ADMIN_INVOICE_STATUS,
  summarizeAdminInvoices
} from '../services/AdminInvoicePolicy';

// Coordina la consulta y los cambios de las facturas
export const useAdminInvoices = () => {
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState(ADMIN_INVOICE_STATUS.all);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const requestIdRef = useRef(0);

  // Consulta la lista sin conservar errores anteriores
  const loadRequests = useCallback(async (refreshing = false) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setError(null);
    if (refreshing) setIsRefreshing(true);

    try {
      const result = await loadAdminInvoiceRequests();
      if (requestId === requestIdRef.current) setRequests(result.requests);
    } catch (loadError) {
      if (requestId === requestIdRef.current) setError(loadError.message);
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  // Actualiza la lista a petición de la administradora
  const refreshRequests = useCallback(() => loadRequests(true), [loadRequests]);

  // Abre el detalle seleccionado
  const openRequest = useCallback((request) => {
    setActionError(null);
    setSelectedRequest(request);
  }, []);

  // Cierra el detalle cuando no existe una operación
  const closeRequest = useCallback(() => {
    if (!isSaving) setSelectedRequest(null);
  }, [isSaving]);

  // Guarda el siguiente estado y refleja la respuesta
  const submitAction = useCallback(async ({ fiscalFolio = '', note = '' }) => {
    if (!selectedRequest) return;
    const action = selectedRequest.status === 'pendiente' ? 'prepare' : 'deliver';
    setActionError(null);
    setIsSaving(true);

    try {
      const result = await updateAdminInvoiceRequest({
        action,
        expectedRevision: selectedRequest.revision,
        fiscalFolio,
        invoiceId: selectedRequest.id,
        note
      });
      setRequests((current) => current.map((request) => (
        request.id === result.invoiceId
          ? {
            ...request,
            fiscalFolio: fiscalFolio || request.fiscalFolio,
            note,
            revision: result.revision,
            status: result.status,
            updatedAt: new Date()
          }
          : request
      )));
      setSelectedRequest(null);
    } catch (saveError) {
      setActionError(saveError.message);
    } finally {
      setIsSaving(false);
    }
  }, [selectedRequest]);

  const summary = useMemo(() => summarizeAdminInvoices(requests), [requests]);
  const filteredRequests = useMemo(() => (
    statusFilter === ADMIN_INVOICE_STATUS.all
      ? requests
      : requests.filter((request) => request.status === statusFilter)
  ), [requests, statusFilter]);

  // Carga la lista al abrir la pantalla
  useEffect(() => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    loadAdminInvoiceRequests()
      .then((result) => {
        if (requestId === requestIdRef.current) setRequests(result.requests);
      })
      .catch((loadError) => {
        if (requestId === requestIdRef.current) setError(loadError.message);
      })
      .finally(() => {
        if (requestId === requestIdRef.current) setIsLoading(false);
      });

    return () => { requestIdRef.current += 1; };
  }, []);

  return {
    actionError,
    closeRequest,
    error,
    filteredRequests,
    isLoading,
    isRefreshing,
    isSaving,
    openRequest,
    refreshRequests,
    selectedRequest,
    setStatusFilter,
    statusFilter,
    submitAction,
    summary
  };
};
