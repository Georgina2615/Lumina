import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  // Extraigo mi usuario, mi rol y mi función para salir desde mi cerebro central (Contexto)
  const { usuario, rol, logout } = useAuth();

  const manejarSalida = async () => {
    try {
      // Ejecuto mi función de cerrado de sesión
      await logout();
    } catch (error) {
      console.error("Error al salir:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Panel Principal</h1>
        
        <button 
          onClick={manejarSalida}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer"
        >
          Cerrar Sesión
        </button>
      </div>
      
      {/* Tarjeta de bienvenida con mis datos reales */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          ¡Hola, {usuario?.displayName}!
        </h2>
        <p className="text-gray-500 mb-6">Mi correo conectado es: {usuario?.email}</p>
        
        <div className="inline-block px-4 py-2 bg-indigo-100 text-indigo-800 rounded-full font-medium tracking-wide">
          Mi nivel de acceso es: {rol ? rol.toUpperCase() : "INVITADO SIN ROL"}
        </div>
      </div>

      {/* Aquí renderizaremos módulos distintos dependiendo del rol más adelante */}
      <div className="mt-8">
        {rol === 'admin' && (
          <div className="p-4 bg-orange-100 text-orange-800 rounded-lg">
             Eres la administradora. Tienes acceso a todas las configuraciones.
          </div>
        )}
        {rol === 'recepcion' && (
          <div className="p-4 bg-blue-100 text-blue-800 rounded-lg">
             Vista de Recepción: Aquí verás el punto de venta y la agenda.
          </div>
        )}
        {rol === 'cosmetologa' && (
          <div className="p-4 bg-emerald-100 text-emerald-800 rounded-lg">
             Vista de Cabina: Aquí verás los diagnósticos y expedientes.
          </div>
        )}
      </div>
    </div>
  );
}