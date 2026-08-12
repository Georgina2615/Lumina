import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../../../../../config/firebase';
import { validAdminUserRoles } from './AdminUsersPolicy';

const mapUserDocument = (documentSnapshot) => {
  const data = documentSnapshot.data() ?? {};
  const email = typeof data.correo === 'string'
    ? data.correo.trim().toLowerCase()
    : '';

  return {
    active: data.activo === true,
    email,
    id: documentSnapshot.id,
    role: validAdminUserRoles.includes(data.rol) ? data.rol : 'unknown'
  };
};

export const loadAdminUsers = async () => {
  const usersQuery = query(
    collection(db, 'usuarios'),
    orderBy('correo')
  );
  const snapshot = await getDocs(usersQuery);

  // Map documents and deduplicate by email (correo)
  const mapped = snapshot.docs.map(mapUserDocument);
  const byEmail = new Map();

  for (const u of mapped) {
    // keep the first occurrence for a given email
    if (!byEmail.has(u.email)) {
      byEmail.set(u.email, u);
    }
  }

  const unique = Array.from(byEmail.values());

  return unique
    .sort((first, second) => (
      first.role.localeCompare(second.role, 'es')
      || first.email.localeCompare(second.email, 'es')
    ));
};
