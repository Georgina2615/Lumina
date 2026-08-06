import { useState } from 'react';
import { FiInbox } from 'react-icons/fi';
import {
  PublicRequestCard,
  PublicRequestReviewModal
} from '../components';
import { usePublicAppointmentRequests } from '../hooks';

// Coordina la revisión de solicitudes públicas
export default function ReceptionPublicRequests() {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const {
    requests,
    loading,
    error,
    processingId,
    clearError,
    loadProof,
    approveRequest,
    rejectRequest
  } = usePublicAppointmentRequests();

  // Cierra el detalle y limpia errores anteriores
  const closeReview = () => {
    clearError();
    setSelectedRequest(null);
  };

  // Ejecuta una decisión y cierra cuando termina
  const runReview = async (action) => {
    try {
      await action();
      closeReview();
    } catch {
      return false;
    }
    return true;
  };

  return (
    <div className="mx-auto flex min-h-full w-full max-w-7xl flex-col gap-6">
      <header>
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
          Recepción
        </p>
        <h1 className="font-title text-3xl font-bold text-primary sm:text-4xl">
          Solicitudes por internet
        </h1>
        <p className="mt-1 text-muted">
          Revisa el comprobante antes de confirmar la cita
        </p>
      </header>

      {error && !selectedRequest && (
        <p className="rounded-2xl border border-error/20 bg-error/10 p-4 text-sm text-error" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex min-h-72 items-center justify-center text-muted">
          Cargando solicitudes
        </div>
      ) : requests.length === 0 ? (
        <div className="flex min-h-72 flex-col items-center justify-center rounded-3xl border border-surface-hover bg-surface p-8 text-center shadow-sm">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-background text-muted">
            <FiInbox aria-hidden="true" size={26} />
          </span>
          <h2 className="mt-4 font-title text-2xl font-bold text-primary">
            Todo está revisado
          </h2>
          <p className="mt-1 text-muted">
            Las nuevas solicitudes aparecerán aquí
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {requests.map((request) => (
            <PublicRequestCard key={request.id} onReview={setSelectedRequest} request={request} />
          ))}
        </div>
      )}

      {selectedRequest && (
        <PublicRequestReviewModal
          error={error}
          isSubmitting={processingId === selectedRequest.id}
          key={selectedRequest.id}
          loadProof={loadProof}
          onApprove={() => runReview(() => approveRequest(selectedRequest.id))}
          onClose={closeReview}
          onReject={(reason) => runReview(() => rejectRequest(selectedRequest.id, reason))}
          request={selectedRequest}
        />
      )}
    </div>
  );
}
