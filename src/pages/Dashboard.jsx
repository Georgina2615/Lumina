import { getAuth, signOut } from "firebase/auth";
import { app } from "../config/firebase";

export default function Dashboard() {
  const auth = getAuth(app);

  const cerrarSesion = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error al cerrar sesión", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Panel Principal</h1>
        
        <button 
          onClick={cerrarSesion}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer"
        >
          Cerrar Sesión
        </button>
      </div>
      <p className="text-gray-600 mt-2">Bienvenida al sistema. Si ves esto, es porque estás autenticada.</p>
    </div>
  );
}