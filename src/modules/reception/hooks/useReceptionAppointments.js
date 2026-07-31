import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createAppointmentBooking,
  subscribeActiveServices,
  subscribeSlotsByDate
} from '../services/AppointmentBookingService';
import { findClientByPhone } from '../services/ClientService';

// Coordina catálogo disponibilidad cliente y reserva
export const useReceptionAppointments = () => {
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState(null);
  const [availabilityDate, setSelectedAvailabilityDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState(null);
  const [foundClient, setFoundClient] = useState(null);
  const [clientSearchLoading, setClientSearchLoading] = useState(false);
  const [clientSearchError, setClientSearchError] = useState(null);
  const clientSearchRequestRef = useRef(0);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookedAppointment, setBookedAppointment] = useState(null);

  // Mantiene el catálogo activo sincronizado
  useEffect(() => (
    subscribeActiveServices({
      onData: (serviceData) => {
        setServices(serviceData);
        setServicesError(null);
        setServicesLoading(false);
      },
      onError: (error) => {
        console.error('Error al sincronizar los servicios', error);
        setServices([]);
        setServicesError('No pudimos cargar los servicios');
        setServicesLoading(false);
      }
    })
  ), []);

  // Mantiene los cupos de la fecha sincronizados
  useEffect(() => {
    if (!availabilityDate) {
      return undefined;
    }
    return subscribeSlotsByDate({
      dateKey: availabilityDate,
      onData: (slotData) => {
        setSlots(slotData);
        setAvailabilityError(null);
        setAvailabilityLoading(false);
      },
      onError: (error) => {
        console.error('Error al sincronizar los cupos', error);
        setSlots([]);
        setAvailabilityError('No pudimos consultar la disponibilidad');
        setAvailabilityLoading(false);
      }
    });
  }, [availabilityDate]);

  const setAvailabilityDate = useCallback((dateKey) => {
    const nextDate = String(dateKey ?? '');

    if (nextDate && !/^\d{4}-\d{2}-\d{2}$/.test(nextDate)) {
      setAvailabilityError('La fecha no es válida');
      return false;
    }

    setSelectedAvailabilityDate(nextDate);
    setSlots([]);
    setAvailabilityError(null);
    setAvailabilityLoading(Boolean(nextDate));
    return true;
  }, []);

  const searchClientByPhone = useCallback(async (phone) => {
    const requestId = clientSearchRequestRef.current + 1;
    clientSearchRequestRef.current = requestId;
    setClientSearchLoading(true);
    setClientSearchError(null);
    setFoundClient(null);

    try {
      const client = await findClientByPhone(phone);
      if (clientSearchRequestRef.current === requestId) {
        setFoundClient(client);
      }
      return client;
    } catch (error) {
      console.error('Error al buscar el cliente', error);
      if (clientSearchRequestRef.current === requestId) {
        setClientSearchError(error.message || 'No pudimos buscar al cliente');
      }
      throw error;
    } finally {
      if (clientSearchRequestRef.current === requestId) {
        setClientSearchLoading(false);
      }
    }
  }, []);

  const clearClientSearch = useCallback(() => {
    clientSearchRequestRef.current += 1;
    setFoundClient(null);
    setClientSearchError(null);
    setClientSearchLoading(false);
  }, []);

  const bookAppointment = useCallback(async (input) => {
    setBookingLoading(true);
    setBookingError(null);
    setBookingSuccess(false);
    setBookedAppointment(null);

    try {
      const booking = await createAppointmentBooking(input);
      setBookedAppointment(booking);
      setBookingSuccess(true);
      return booking;
    } catch (error) {
      console.error('Error al crear la cita', error);
      setBookingError(error.message || 'No pudimos crear la cita');
      throw error;
    } finally {
      setBookingLoading(false);
    }
  }, []);

  const resetBooking = useCallback(() => {
    setBookingError(null);
    setBookingSuccess(false);
    setBookedAppointment(null);
  }, []);

  return {
    services,
    servicesLoading,
    servicesError,
    slots,
    availabilityDate,
    availabilityLoading,
    availabilityError,
    setAvailabilityDate,
    foundClient,
    clientSearchLoading,
    clientSearchError,
    searchClientByPhone,
    clearClientSearch,
    bookingLoading,
    bookingError,
    bookingSuccess,
    bookedAppointment,
    bookAppointment,
    resetBooking
  };
};
