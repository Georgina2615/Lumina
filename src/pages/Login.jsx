import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  // Traigo mi función de login desde mi capa lógica
  const { login } = useAuth();

  const manejarIngreso = async () => {
    try {
      // Ejecuto mi función; si falla, el catch lo atrapa
      await login();
      // Si todo sale bien, me dirijo a mi panel
      navigate("/dashboard");
    } catch (error) {
      alert("Hubo un problema al intentar conectarme.");
    }
  };

  return (
    <div className="min-h-screen bg-orange-50 flex flex-col items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-md text-center max-w-sm w-full">
        <h1 className="text-4xl font-bold text-gray-800 mb-6">Luminosa</h1>
        <p className="text-gray-600 mb-8">Ingresa al sistema de administración</p>
        
        <button 
          onClick={manejarIngreso}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors cursor-pointer"
        >
          Entrar con Google
        </button>
      </div>
    </div>
  );
}