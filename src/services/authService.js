import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { app } from "../config/firebase";

// Preparo instancia de autenticación
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export const iniciarSesionGoogle = async () => {
  try {
    // Ventana emergente de Google para iniciar sesión
    const resultado = await signInWithPopup(auth, provider);
    return resultado.user;
  } catch (error) {
    console.error("Error en mi servicio de login:", error);
    throw error;
  }
};

export const cerrarSesionApp = async () => {
  try {
    // Le digo a Firebase que cierre mi sesión activa
    await signOut(auth);
  } catch (error) {
    console.error("Error al cerrar mi sesión:", error);
    throw error;
  }
};