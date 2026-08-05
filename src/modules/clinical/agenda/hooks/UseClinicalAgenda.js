import { useCallback, useEffect, useState } from 'react';
import { getBusinessDateKey } from '../../../../shared/services/AppointmentSchedulePolicy';
import { groupClinicalAppointments } from '../services/ClinicalAgendaPolicy';
import { subscribeClinicalAgenda } from '../services/ClinicalAgendaQueryService';

// Sincroniza la agenda diaria de cabina
export const useClinicalAgenda = () => {
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionVersion, setSubscriptionVersion] = useState(0);
  const dateKey = getBusinessDateKey();

  useEffect(() => {
    // Escucha los cambios reales de la jornada
    const unsubscribe = subscribeClinicalAgenda({
      dateKey,
      onData: (nextAppointments) => {
        setAppointments(nextAppointments);
        setIsLoading(false);
      },
      onError: (subscriptionError) => {
        console.error('Error al sincronizar la agenda de cabina', subscriptionError);
        setError('No pudimos cargar las citas de hoy');
        setIsLoading(false);
      }
    });

    // Detiene la escucha anterior
    return unsubscribe;
  }, [dateKey, subscriptionVersion]);

  // Reinicia la conexión cuando se solicita
  const refresh = useCallback(() => {
    setError(null);
    setIsLoading(true);
    setSubscriptionVersion((currentVersion) => currentVersion + 1);
  }, []);

  return {
    appointments,
    dateKey,
    error,
    groups: groupClinicalAppointments(appointments),
    isLoading,
    refresh
  };
};
