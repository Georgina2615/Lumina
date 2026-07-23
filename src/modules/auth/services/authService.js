import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { app, db } from "../../../config/firebase";

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

provider.setCustomParameters({ prompt: "select_account" });

/** Inicia sesión mediante el proveedor emergente de Google.
 * @returns {Promise<Object>} Objeto con los datos del usuario autenticado.
 */
export const iniciarSesionGoogle = async () => {
  try {
    const resultado = await signInWithPopup(auth, provider);
    return resultado.user;
  } catch (error) {
    console.error("Error en servicio de autenticación (Google):", error);
    throw error;
  }
};

/**
 * Consulta la colección de usuarios en Firestore para determinar el nivel de acceso.
 * @param {string} correoElectronico - Email del usuario autenticado.
 * @returns {Promise<string|null>} El rol del usuario o null si no existe.
 */
export const obtenerRolUsuario = async (correoElectronico) => {
  try {
    const usuariosRef = collection(db, "usuarios");
    const consulta = query(usuariosRef, where("correo", "==", correoElectronico));
    const querySnapshot = await getDocs(consulta);

    if (!querySnapshot.empty) {
      const datosUsuario = querySnapshot.docs[0].data();
      return datosUsuario.rol; 
    }
    
    return null; 
  } catch (error) {
    console.error("Error al consultar rol en Firestore:", error);
    throw error;
  }
};

/**
 * Cierra la sesión activa en el cliente de Firebase.
 */
export const cerrarSesionApp = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error al finalizar la sesión:", error);
    throw error;
  }
};