import { FcGoogle } from 'react-icons/fc';
import { IoClose } from 'react-icons/io5';

import { useLogin } from '../hooks';
import { useAccessibleDialog } from '../../../shared/hooks';

export default function LoginModal({ isOpen, onClose }) {
  const { errorLocal, isSubmitting, manejarIngresoGoogle } = useLogin();
  const dialogRef = useAccessibleDialog({
    canClose: !isSubmitting,
    focusKey: errorLocal ? 'error' : 'login',
    isOpen,
    onRequestClose: onClose
  });

  if (!isOpen) return null;

  return (
    <div
      aria-labelledby="login-modal-title"
      aria-describedby="login-modal-description"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="dialog"
    >
      <div className="relative m-4 w-full max-w-md rounded-2xl bg-surface p-8 shadow-xl" ref={dialogRef} tabIndex="-1">
        <button
          aria-label="Cerrar acceso"
          className="absolute right-4 top-4 text-muted transition-colors hover:text-primary"
          onClick={onClose}
          type="button"
        >
          <IoClose size={24} />
        </button>

        <h2 className="mb-2 text-center font-title text-2xl text-primary" data-dialog-initial-focus id="login-modal-title" tabIndex="-1">
          Iniciar sesión
        </h2>
        <p className="mb-6 text-center text-sm text-muted" id="login-modal-description">
          Ingresa con la cuenta asignada por Lumina Skin
        </p>

        {errorLocal && (
          <div className="mb-4 rounded-lg bg-error/10 p-3 text-center text-sm text-error">
            {errorLocal}
          </div>
        )}

        <button
          className={`flex w-full items-center justify-center gap-3 rounded-xl border border-surface-hover px-4 py-3 font-medium transition-colors ${
            isSubmitting
              ? 'cursor-not-allowed bg-surface-hover text-muted'
              : 'bg-background text-primary hover:bg-surface-hover'
          }`}
          disabled={isSubmitting}
          onClick={manejarIngresoGoogle}
          type="button"
        >
          {!isSubmitting && <FcGoogle size={24} />}
          {isSubmitting ? 'Comprobando acceso' : 'Continuar con Google'}
        </button>
      </div>
    </div>
  );
}
