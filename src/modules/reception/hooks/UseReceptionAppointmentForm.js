import { useEffect, useRef, useState } from 'react';
import {
  BOOKING_TIMES,
  getBusinessDateKey,
  validateBookingSchedule
} from '../services/AppointmentBookingService';
import {
  buildDepositInput,
  createPaymentDraft
} from '../services/PaymentPolicy';
import { useReceptionAppointments } from './useReceptionAppointments';

const emptyClient = { fullName: '', phone: '', email: '' };

// Convierte el cliente persistido al formulario
const mapFoundClient = (client) => ({
  id: client.id,
  fullName: client.nombreCompleto || '',
  phone: client.telefono || '',
  email: client.email || ''
});

// Orquesta los estados del formulario presencial
export const useReceptionAppointmentForm = ({
  initialSlot,
  onClose,
  onSubmittingChange
}) => {
  const {
    services, servicesLoading, servicesError,
    slots, availabilityDate, availabilityLoading, availabilityError, setAvailabilityDate,
    foundClient, clientSearchLoading, clientSearchError,
    searchClientByPhone, clearClientSearch,
    bookingLoading, bookingError, bookingSuccess, bookedAppointment,
    bookAppointment, resetBooking
  } = useReceptionAppointments();
  const [client, setClient] = useState(emptyClient);
  const [appointment, setAppointment] = useState({
    serviceId: '', dateKey: initialSlot?.dateKey || '', time: initialSlot?.hour || ''
  });
  const [payment, setPayment] = useState(createPaymentDraft);
  const [localError, setLocalError] = useState(null);
  const searchRef = useRef({ phone: '', result: null });
  const submitLockRef = useRef(false);
  const selectedService = services.find(({ id }) => id === appointment.serviceId);
  const depositCents = selectedService
    ? Math.round(selectedService.priceCents * selectedService.depositPercentage / 100)
    : 0;
  const currentSlots = availabilityDate === appointment.dateKey ? slots : [];
  const timeOptions = BOOKING_TIMES.map((bookingTime) => {
    const occupied = currentSlots.some(
      ({ time }) => time === bookingTime.value
    );
    let scheduleUnavailable = false;

    try {
      validateBookingSchedule({
        dateKey: appointment.dateKey,
        time: bookingTime.value
      });
    } catch {
      scheduleUnavailable = Boolean(appointment.dateKey);
    }

    return {
      ...bookingTime,
      disabled: occupied || scheduleUnavailable,
      status: occupied
        ? 'Ocupado'
        : scheduleUnavailable
          ? 'No disponible'
          : ''
    };
  });
  const selectedTimeUnavailable = timeOptions.some(
    ({ disabled, value }) => disabled && value === appointment.time
  );
  const displayedAppointment = selectedTimeUnavailable
    ? { ...appointment, time: '' }
    : appointment;

  // Sincroniza fecha modal y estado de escritura
  useEffect(() => setAvailabilityDate(appointment.dateKey), [
    appointment.dateKey, setAvailabilityDate
  ]);
  useEffect(() => onSubmittingChange?.(bookingLoading), [
    bookingLoading, onSubmittingChange
  ]);
  useEffect(() => () => onSubmittingChange?.(false), [onSubmittingChange]);

  // Verifica el teléfono sin duplicar solicitudes
  const verifyPhone = async () => {
    const phone = client.phone.replace(/\D/g, '');
    if (!/^\d{10}$/.test(phone)) {
      return null;
    }
    if (searchRef.current.phone === phone) {
      return searchRef.current.promise || searchRef.current.result;
    }

    const promise = searchClientByPhone(phone);
    searchRef.current = { phone, result: null, promise };
    try {
      const result = await promise;

      // Descarta respuestas de una búsqueda anterior
      if (
        searchRef.current.phone !== phone
        || searchRef.current.promise !== promise
      ) {
        return undefined;
      }

      searchRef.current = { phone, result, promise: null };
      if (result) {
        setClient(mapFoundClient(result));
      }
      return result;
    } catch {
      if (
        searchRef.current.phone === phone
        && searchRef.current.promise === promise
      ) {
        searchRef.current = { phone: '', result: null, promise: null };
      }
      return undefined;
    }
  };

  // Actualiza la identidad editable
  const handleClientChange = (field, value) => {
    const nextValue = field === 'phone'
      ? value.replace(/\D/g, '').slice(0, 10)
      : value;
    if (field === 'phone') {
      searchRef.current = { phone: '', result: null, promise: null };
      clearClientSearch();
    }
    setClient((current) => ({ ...current, [field]: nextValue }));
    setLocalError(null);
  };

  // Restablece la selección de cliente
  const handleClearClient = () => {
    clearClientSearch();
    searchRef.current = { phone: '', result: null, promise: null };
    setClient(emptyClient);
  };

  // Actualiza servicio fecha u hora
  const handleAppointmentChange = (field, value) => {
    setAppointment((current) => ({
      ...current, [field]: value, ...(field === 'dateKey' ? { time: '' } : {})
    }));
    if (field === 'serviceId') {
      setPayment(createPaymentDraft());
    }
    setLocalError(null);
    resetBooking();
  };

  // Envía una sola reserva protegida
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitLockRef.current || bookingLoading) {
      return;
    }
    submitLockRef.current = true;
    onSubmittingChange?.(true);
    setLocalError(null);
    try {
      const matchedClient = await verifyPhone();
      if (matchedClient === undefined) {
        return;
      }
      if (!selectedService || depositCents <= 0) {
        throw new Error('Selecciona un servicio disponible');
      }
      if (currentSlots.some(({ time }) => time === appointment.time)) {
        throw new Error('El horario acaba de ser ocupado');
      }
      const activeClient = matchedClient ? mapFoundClient(matchedClient) : client;
      await bookAppointment({
        client: {
          ...(activeClient.id ? { id: activeClient.id } : {}),
          fullName: activeClient.fullName.trim(),
          phone: activeClient.phone,
          ...(activeClient.email.trim() ? { email: activeClient.email.trim() } : {})
        },
        serviceId: appointment.serviceId,
        dateKey: appointment.dateKey,
        time: appointment.time,
        deposit: buildDepositInput(payment, depositCents)
      });
    } catch (error) {
      setLocalError(error.message || 'Revisa los datos de la cita');
    } finally {
      submitLockRef.current = false;
      onSubmittingChange?.(false);
    }
  };

  // Cierra el resultado confirmado
  const handleSuccessClose = () => {
    resetBooking();
    onClose();
  };

  return {
    clientSectionProps: {
      client,
      clientFound: foundClient,
      clientSearchError,
      clientSearchLoading,
      onChange: handleClientChange,
      onClearClient: handleClearClient,
      onVerifyPhone: () => { void verifyPhone(); }
    },
    detailsSectionProps: {
      appointment: displayedAppointment,
      availabilityDate,
      availabilityError,
      availabilityLoading,
      minDate: getBusinessDateKey(),
      onChange: handleAppointmentChange,
      services,
      servicesError,
      servicesLoading,
      timeOptions
    },
    paymentSectionProps: { depositCents, payment, onChange: setPayment },
    showPayment: Boolean(selectedService && depositCents > 0),
    error: bookingError || localError,
    isBooking: bookingLoading,
    submitDisabled: bookingLoading || clientSearchLoading
      || servicesLoading || availabilityLoading || selectedTimeUnavailable,
    success: bookingSuccess && Boolean(bookedAppointment),
    confirmedName: foundClient?.nombreCompleto || client.fullName,
    handleSubmit,
    handleSuccessClose,
    onClose
  };
};
