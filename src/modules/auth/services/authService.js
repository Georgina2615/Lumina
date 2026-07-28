import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { collection, doc, getDoc, getDocs, limit, query, where } from "firebase/firestore";
import { app, db } from "../../../config/firebase";

// Configura el acceso de Firebase
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Define los roles válidos del sistema
const validRoles = new Set(["admin", "recepcion", "cosmetologa"]);

provider.setCustomParameters({ prompt: "select_account" });

// Valida el rol almacenado del usuario
const resolveRole = (userData, email, requiresActiveFlag) => {
  // Normaliza el correo autenticado
  const normalizedEmail = email?.trim().toLowerCase();
  const storedEmail = userData?.correo?.trim().toLowerCase();
  const isActive = requiresActiveFlag
    ? userData?.activo === true
    : userData?.activo !== false;

  // Detiene documentos inválidos o inactivos
  if (!normalizedEmail || storedEmail !== normalizedEmail || !isActive) {
    // Devuelve ausencia de acceso
    return null;
  }

  // Obtiene el rol almacenado
  const role = userData?.rol;

  // Devuelve únicamente roles reconocidos
  return validRoles.has(role) ? role : null;
};

// Inicia sesión con Google
export const iniciarSesionGoogle = async () => {
  try {
    // Abre el proveedor de Google
    const result = await signInWithPopup(auth, provider);

    // Devuelve el usuario autenticado
    return result.user;
  } catch (error) {
    console.error("Error en servicio de autenticación (Google):", error);
    throw error;
  }
};

// Obtiene el rol por UID con respaldo temporal por correo
export const obtenerRolUsuario = async (email) => {
  try {
    // Obtiene la sesión vigente
    const authenticatedUser = auth.currentUser;
    const authenticatedEmail = authenticatedUser?.email?.trim().toLowerCase();
    const requestedEmail = email?.trim().toLowerCase();

    // Evita resolver una identidad diferente
    if (!authenticatedUser?.uid || authenticatedEmail !== requestedEmail) {
      // Devuelve ausencia de acceso
      return null;
    }

    // Consulta primero el documento canónico por UID
    const userReference = doc(db, "usuarios", authenticatedUser.uid);
    const userSnapshot = await getDoc(userReference);

    // Prioriza el documento canónico incluso si está inactivo
    if (userSnapshot.exists()) {
      // Devuelve el rol validado
      return resolveRole(userSnapshot.data(), authenticatedEmail, true);
    }

    // Consulta el documento anterior por compatibilidad
    const usersReference = collection(db, "usuarios");
    const legacyQuery = query(
      usersReference,
      where("correo", "==", authenticatedEmail),
      limit(1)
    );
    const legacySnapshot = await getDocs(legacyQuery);

    // Detiene la búsqueda cuando no existe un registro anterior
    if (legacySnapshot.empty) {
      // Devuelve ausencia de acceso
      return null;
    }

    // Devuelve el rol anterior validado
    return resolveRole(legacySnapshot.docs[0].data(), authenticatedEmail, false);
  } catch (error) {
    console.error("Error al consultar rol en Firestore:", error);
    throw error;
  }
};

// Cierra la sesión activa
export const cerrarSesionApp = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error al finalizar la sesión:", error);
    throw error;
  }
};
