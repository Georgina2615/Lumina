import { useContext } from 'react';

import { AuthContext } from './AuthContext';

// Expone el estado de autenticacion
export const useAuth = () => useContext(AuthContext);
