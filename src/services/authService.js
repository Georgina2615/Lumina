import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore"; // Herramientas de consulta
import { app, db } from "../config/firebase";

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export const iniciarSesionGoogle = async () => {
  try {
    const resultado = await signInWithPopup(auth, provider);
    return resultado.user;
  } catch (error) {
    console.error("Error en mi servicio de login:", error);
    throw error;
  }
};

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
    console.error("Error al obtener mi rol desde Firestore:", error);
    throw error;
  }
};

export const cerrarSesionApp = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error al cerrar mi sesión:", error);
    throw error;
  }
};