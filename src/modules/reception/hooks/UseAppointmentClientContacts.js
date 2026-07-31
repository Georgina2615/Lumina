import { useEffect, useMemo, useState } from 'react';
import {
  subscribeAppointmentClientContacts
} from '../services/AppointmentClientContactService';

// Escucha contactos reales de las citas pendientes
export const useAppointmentClientContacts = (appointments) => {
  // Conserva solo identidades válidas y únicas
  const clientIdsKey = useMemo(() => (
    [...new Set(
      appointments
        .map((appointment) => appointment.clienteId)
        .filter((clientId) => typeof clientId === 'string' && clientId)
    )].sort().join('|')
  ), [appointments]);
  const [contactsByClientId, setContactsByClientId] = useState({});

  useEffect(() => {
    // Reconstruye las identidades estables
    const clientIds = clientIdsKey ? clientIdsKey.split('|') : [];

    // Escucha únicamente los clientes requeridos
    const unsubscribe = subscribeAppointmentClientContacts({
      clientIds,
      onData: setContactsByClientId,
      onError: (error) => {
        console.error('Error al sincronizar contactos de citas', error);
        setContactsByClientId({});
      }
    });

    // Detiene la escucha vigente
    return () => unsubscribe();
  }, [clientIdsKey]);

  // Devuelve contactos separados de las citas
  return contactsByClientId;
};
