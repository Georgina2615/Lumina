import { useState } from "react";
import { useAuth } from '../context';
import { useNavigate } from "react-router-dom";

export const useLogin = () => {
  const [errorLocal, setErrorLocal] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const manejarIngresoGoogle = async () => {
    setErrorLocal(null);
    setIsSubmitting(true);

    try {
      await login();
      // Redirige automáticamente al área de trabajo
      navigate("/dashboard");
    } catch (error) {
      console.error("Error al ingresar con Google:", error);
      setErrorLocal("Hubo un problema al conectar con Google. Intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return { errorLocal, isSubmitting, manejarIngresoGoogle };
};