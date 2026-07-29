import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../auth/context';
import {
  subscribeClients,
  updateClientContact
} from '../services/ClientService';

// Coordina el directorio y la actualización de contacto
export const useClients = () => {
  const { usuario: user } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mantiene el directorio sincronizado
  useEffect(() => (
    subscribeClients({
      onData: (clientData) => {
        setClients(clientData);
        setError(null);
        setLoading(false);
      },
      onError: (subscriptionError) => {
        console.error(
          'Error al sincronizar el directorio',
          subscriptionError
        );
        setClients([]);
        setError('Error al cargar la base de datos de clientes');
        setLoading(false);
      }
    })
  ), []);

  const updateContact = useCallback(async (clientId, contact) => {
    try {
      return await updateClientContact({
        clientId,
        phone: contact?.phone ?? contact?.telefono,
        email: contact?.email,
        actorUid: user?.uid
      });
    } catch (updateError) {
      console.error('Error al actualizar el contacto', updateError);
      throw updateError;
    }
  }, [user]);

  return {
    clients,
    loading,
    error,
    updateContact,
    ['clientes']: clients,
    ['cargando']: loading,
    ['errorLocal']: error,
    ['actualizarContacto']: updateContact
  };
};
