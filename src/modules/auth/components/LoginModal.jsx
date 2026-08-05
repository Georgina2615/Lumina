import { FcGoogle } from 'react-icons/fc';
import { IoClose } from 'react-icons/io5';

import { useLogin } from '../hooks';

export default function LoginModal({ isOpen, onClose }) {
  const { errorLocal, isSubmitting, manejarIngresoGoogle } = useLogin();

  if (!isOpen) return null;

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="dialog"
    >
      <div className="relative m-4 w-full max-w-md rounded-2xl bg-surface p-8 shadow-xl">
        <button
          aria-label="Cerrar acceso"
          className="absolute right-4 top-4 text-muted transition-colors hover:text-primary"
          onClick={onClose}
          type="button"
        >
          <IoClose size={24} />
        </button>

        <h2 className="mb-2 text-center font-title text-2xl text-primary">
          Iniciar sesión
        </h2>
        <p className="mb-6 text-center text-sm text-muted">
          Ingresa con la cuenta asignada por Lumina Skin
        </p>

        {errorLocal && (
          <div className="mb-4 rounded-lg bg-error/10 p-3 text-center text-sm text-error">
            {errorLocal}
          </div>
        )}

        <button
          className={`flex w-full items-center justify-center gap-3 rounded-xl border border-surfaceHover px-4 py-3 font-medium transition-colors ${
            isSubmitting
              ? 'cursor-not-allowed bg-surfaceHover text-muted'
              : 'bg-background text-primary hover:bg-surfaceHover'
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
