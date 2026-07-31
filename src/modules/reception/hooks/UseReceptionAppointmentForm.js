import { useEffect, useRef, useState } from 'react';
import {
  buildBookingTimeOptions,
  getBusinessDateKey
} from '../services/AppointmentBookingService';
import { createPaymentDraft } from '../services/PaymentPolicy';
import { buildAppointmentSubmission } from '../services/AppointmentSubmissionPolicy';
import { useReceptionAppointments } from './useReceptionAppointments';
import { useAppointmentRescheduling } from './UseAppointmentRescheduling';

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
    bookAppointment, reprogramAppointment, resetBooking
  } = useReceptionAppointments();
  const [client, setClient] = useState(emptyClient);
  const [appointment, setAppointment] = useState({
    serviceId: '', dateKey: initialSlot?.dateKey || '', time: initialSlot?.hour || ''
  });
  const [payment, setPayment] = useState(createPaymentDraft);
  const [localError, setLocalError] = useState(null);
  const searchRef = useRef({ phone: '', result: null });
  const submitLockRef = useRef(false);
  const rescheduling = useAppointmentRescheduling(foundClient?.id);
  const selectedService = services.find(({ id }) => id === appointment.serviceId);
  const requiredDepositCents = selectedService
    ? Math.round(selectedService.priceCents * selectedService.depositPercentage / 100)
    : 0;
  const additionalDepositCents = Math.max(
    requiredDepositCents - (rescheduling.selectedCredit?.creditCents ?? 0),
    0
  );
  const creditLookupReady = !foundClient || rescheduling.ready;
  const creditExceedsServicePrice = Boolean(selectedService
    && rescheduling.selectedCredit
    && rescheduling.selectedCredit.creditCents > selectedService.priceCents);
  const currentSlots = availabilityDate === appointment.dateKey ? slots : [];
  const timeOptions = buildBookingTimeOptions({
    dateKey: appointment.dateKey,
    slots: currentSlots
  });
  const selectedTimeUnavailable = timeOptions.some(
    ({ disabled, value }) => disabled && value === appointment.time
  );
  const displayedAppointment = selectedTimeUnavailable
    ? { ...appointment, time: '' }
    : appointment;

  // Sincroniza fecha modal y estado de escritura
  useEffect(() => {
    setAvailabilityDate(appointment.dateKey);
  }, [appointment.dateKey, setAvailabilityDate]);
  useEffect(() => {
    onSubmittingChange?.(bookingLoading);
  }, [bookingLoading, onSubmittingChange]);
  useEffect(() => () => {
    onSubmittingChange?.(false);
  }, [onSubmittingChange]);

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
      rescheduling.clearSelection();
    }
    setClient((current) => ({ ...current, [field]: nextValue }));
    setLocalError(null);
    resetBooking();
  };

  // Restablece la selección de cliente
  const handleClearClient = () => {
    clearClientSearch();
    rescheduling.clearSelection();
    searchRef.current = { phone: '', result: null, promise: null };
    setClient(emptyClient);
    setLocalError(null);
    resetBooking();
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

  // Actualiza la decisión de crédito y limpia el pago anterior
  const handleCreditChoiceChange = (choice) => {
    rescheduling.onCreditChoiceChange(choice);
    setPayment(createPaymentDraft());
    setLocalError(null);
    resetBooking();
  };

  // Reintenta la consulta sin conservar errores anteriores
  const handleCreditRetry = () => {
    setLocalError(null);
    resetBooking();
    rescheduling.retry();
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
      if (!selectedService || requiredDepositCents <= 0) {
        throw new Error('Selecciona un servicio disponible');
      }
      if (currentSlots.some(({ time }) => time === appointment.time)) {
        throw new Error('El horario acaba de ser ocupado');
      }
      const activeClient = matchedClient ? mapFoundClient(matchedClient) : client;

      // Comprueba créditos antes de decidir el comando
      const availableCredits = activeClient.id
        ? await rescheduling.ensureCredits(activeClient.id)
        : [];
      const submission = buildAppointmentSubmission({
        activeClient,
        appointment,
        availableCredits,
        creditChoice: rescheduling.creditChoice,
        payment,
        requiredDepositCents,
        servicePriceCents: selectedService.priceCents
      });

      // Ejecuta únicamente el comando elegido
      if (submission.type === 'reschedule') {
        await reprogramAppointment(submission.request);
      } else {
        await bookAppointment(submission.request);
      }
    } catch (error) {
      setLocalError(error.message || 'Revisa los datos de la cita');
    } finally {
      submitLockRef.current = false;
      onSubmittingChange?.(false);
    }
  };

  // Cierra el resultado registrado
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
    paymentSectionProps: {
      depositCents: additionalDepositCents,
      isAdditionalDeposit: Boolean(rescheduling.selectedCredit),
      payment,
      onChange: (nextPayment) => {
        setPayment(nextPayment);
        setLocalError(null);
        resetBooking();
      }
    },
    creditSelectorProps: {
      additionalDepositCents,
      creditChoice: rescheduling.creditChoice,
      credits: rescheduling.credits,
      error: rescheduling.error,
      loading: rescheduling.loading,
      onChange: handleCreditChoiceChange,
      onRetry: handleCreditRetry,
      requiredDepositCents,
      selectedCredit: rescheduling.selectedCredit,
      servicePriceCents: selectedService?.priceCents ?? 0
    },
    showCreditSelector: Boolean(foundClient),
    showPayment: Boolean(
      selectedService
      && additionalDepositCents > 0
      && creditLookupReady
      && !rescheduling.decisionPending
      && !rescheduling.error
    ),
    error: bookingError || localError,
    isBooking: bookingLoading,
    submitDisabled: bookingLoading || clientSearchLoading
      || servicesLoading || availabilityLoading || selectedTimeUnavailable
      || rescheduling.loading || rescheduling.decisionPending
      || !creditLookupReady || creditExceedsServicePrice
      || Boolean(rescheduling.error),
    success: bookingSuccess && Boolean(bookedAppointment),
    isRescheduled: Boolean(bookedAppointment?.isRescheduled),
    submitLabel: rescheduling.selectedCredit
      ? additionalDepositCents > 0
        ? 'Aplicar crédito y registrar diferencia'
        : 'Aplicar crédito y reprogramar'
      : 'Registrar anticipo y reservar',
    registeredName: foundClient?.nombreCompleto || client.fullName,
    handleSubmit,
    handleSuccessClose,
    onClose
  };
};
