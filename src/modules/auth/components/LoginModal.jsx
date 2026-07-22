import { FcGoogle } from "react-icons/fc";
import { IoClose } from "react-icons/io5"; 
import { useLogin } from "../../hooks/useLogin"; 

export default function LoginModal({ isOpen, onClose }) {
  // Variables y la función
  const { errorLocal, isSubmitting, manejarIngresoGoogle } = useLogin();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      {/* Contenedor del Modal */}
      <div className="bg-surface w-full max-w-md p-8 rounded-2xl shadow-xl relative m-4">
        
        {/* Botón para cerrar el modal */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-muted hover:text-primary transition-colors"
        >
          <IoClose size={24} />
        </button>

        <h2 className="text-2xl font-title text-primary text-center mb-2">
          Iniciar Sesión
        </h2>
        <p className="text-muted text-center mb-6 text-sm">
          Bienvenido a Lumina Skin. Ingresa con tu cuenta .
        </p>

        {/* Mensaje de Error */}
        {errorLocal && (
          <div className="bg-error/10 text-error p-3 rounded-lg text-sm text-center mb-4">
            {errorLocal}
          </div>
        )}

        {/* Botón de Google */}
        <button
          onClick={manejarIngresoGoogle}
          disabled={isSubmitting}
          className={`w-full flex items-center justify-center gap-3 py-3 px-4 border border-surfaceHover rounded-xl font-medium transition-colors ${
            isSubmitting
              ? "bg-surfaceHover cursor-not-allowed text-muted"
              : "bg-background text-primary hover:bg-surfaceHover"
          }`}
        >
          {!isSubmitting && <FcGoogle size={24} />}
          {isSubmitting ? "Conectando..." : "Continuar con Google"}
        </button>
      </div>
    </div>
  );
}