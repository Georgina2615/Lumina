import { useMemo, useRef, useState } from 'react';
import { usePublicServices } from './UsePublicServices';
import { usePublicPaymentReturn } from './UsePublicPaymentReturn';
import {
  buildPublicTimeOptions,
  normalizePublicClient,
  validatePublicDetailsStep,
  validatePublicPaymentStep,
  validatePublicServiceStep
} from '../services/PublicBookingPolicy';
import {
  createPublicBookingPayment,
  loadPublicAvailability
} from '../services/PublicBookingService';

// Obtiene una recomendación segura desde la dirección
const getRecommendedServiceId = () => {
  const serviceId = new URLSearchParams(globalThis.location.search).get('servicio') ?? '';
  return /^[A-Za-z0-9_-]{3,128}$/.test(serviceId) ? serviceId : '';
};

// Define el estado inicial del formulario
const buildInitialFields = () => ({
  serviceId: getRecommendedServiceId(),
  fullName: '',
  phone: '',
  email: '',
  dateKey: '',
  time: '',
  privacyAccepted: false,
  termsAccepted: false,
  cancellationAccepted: false
});

// Controla el recorrido completo del agendamiento publico
export const usePublicBooking = () => {
  const catalog = usePublicServices();
  const paymentReturn = usePublicPaymentReturn();
  const [fields, setFields] = useState(() => ({
    ...buildInitialFields(),
    ...paymentReturn.fields
  }));
  const [step, setStep] = useState(paymentReturn.returning ? 4 : 1);
  const [availability, setAvailability] = useState([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const availabilityRequest = useRef(0);

  const selectedService = useMemo(
    () => catalog.services.find(({ id }) => id === fields.serviceId) ?? null,
    [catalog.services, fields.serviceId]
  );
  const timeOptions = useMemo(() => buildPublicTimeOptions({
    availability,
    dateKey: fields.dateKey
  }), [availability, fields.dateKey]);
  const depositAmountCents = selectedService
    ? Math.round(selectedService.priceCents * 0.3)
    : 0;

  // Actualiza un campo sin propagar estados laterales
  const updateField = (name, value) => {
    setFields((current) => ({
      ...current,
      [name]: value,
      ...(name === 'dateKey' ? { time: '' } : {})
    }));
    setError('');

    if (name === 'dateKey') {
      const requestId = availabilityRequest.current + 1;
      availabilityRequest.current = requestId;
      setAvailability([]);
      setAvailabilityLoading(Boolean(value));
      if (value) {
        loadPublicAvailability(value)
          .then((times) => {
            if (availabilityRequest.current === requestId) setAvailability(times);
          })
          .catch((loadError) => {
            if (availabilityRequest.current === requestId) setError(loadError.message);
          })
          .finally(() => {
            if (availabilityRequest.current === requestId) {
              setAvailabilityLoading(false);
            }
          });
      }
    }
  };

  // Avanza solo cuando el paso actual es valido
  const goNext = () => {
    try {
      if (step === 1) {
        validatePublicServiceStep({ serviceId: selectedService?.id ?? '' });
      }
      if (step === 2) validatePublicDetailsStep({ ...fields, availability });
      setError('');
      setStep((current) => Math.min(current + 1, 3));
      window.scrollTo({ behavior: 'smooth', top: 0 });
    } catch (validationError) {
      setError(validationError.message);
    }
  };

  // Regresa al paso anterior sin borrar informacion
  const goBack = () => {
    setError('');
    setStep((current) => Math.max(current - 1, 1));
    window.scrollTo({ behavior: 'smooth', top: 0 });
  };

  // Crea el pago y dirige al sitio seguro
  const submit = async () => {
    try {
      validatePublicPaymentStep(fields);
      const client = normalizePublicClient(fields);
      setSubmitting(true);
      setError('');
      const response = await createPublicBookingPayment({
        client,
        serviceId: fields.serviceId,
        dateKey: fields.dateKey,
        time: fields.time,
        privacyAccepted: fields.privacyAccepted,
        termsAccepted: fields.termsAccepted,
        cancellationAccepted: fields.cancellationAccepted,
        returnOrigin: globalThis.location.origin
      });
      sessionStorage.setItem(`lumina-payment-${response.sessionId}`, JSON.stringify({
        fields: {
          serviceId: fields.serviceId,
          dateKey: fields.dateKey,
          time: fields.time
        }
      }));
      globalThis.location.assign(response.checkoutUrl);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Expone solo el contrato necesario para la pantalla
  return {
    availabilityLoading,
    catalog,
    depositAmountCents,
    error,
    fields,
    goBack,
    goNext,
    result: paymentReturn.result,
    selectedService,
    step,
    submit,
    submitting,
    timeOptions,
    updateField
  };
};
