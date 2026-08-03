import { useState } from 'react';

// Define el límite compatible con correo electrónico
const emailMaxLength = 254;

// Comprueba una estructura de correo utilizable
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

// Normaliza el correo sin conservar espacios
const normalizeReceiptEmail = (value) => (
  String(value ?? '').trim().toLowerCase()
);

// Explica una captura inválida
const getReceiptEmailError = (value) => {
  // Normaliza el valor recibido
  const normalizedEmail = normalizeReceiptEmail(value);

  // Permite omitir el ticket digital
  if (!normalizedEmail) {
    // Devuelve ausencia de error
    return null;
  }

  // Rechaza correos demasiado extensos
  if (normalizedEmail.length > emailMaxLength) {
    // Devuelve el límite permitido
    return 'El correo no puede superar doscientos cincuenta y cuatro caracteres';
  }

  // Localiza el separador principal
  const separatorIndex = normalizedEmail.lastIndexOf('@');

  // Rechaza formatos incompletos
  if (
    separatorIndex < 1
    || separatorIndex > 64
    || !emailPattern.test(normalizedEmail)
  ) {
    // Devuelve una orientación clara
    return 'Escribe un correo válido para enviar el comprobante';
  }

  // Confirma una captura válida
  return null;
};

// Controla el correo opcional del ticket de mostrador
export const usePOSReceipt = ({
  isWalkIn,
  restoredReceiptEmail = ''
}) => {
  // Conserva únicamente datos del flujo de mostrador
  const initialEmail = isWalkIn
    ? normalizeReceiptEmail(restoredReceiptEmail)
    : '';
  // Conserva el correo capturado
  const [receiptEmail, setReceiptEmail] = useState(initialEmail);
  // Conserva la validación visible
  const [receiptEmailError, setReceiptEmailError] = useState(null);

  // Actualiza el correo sin exceder el límite
  const updateReceiptEmail = (value) => {
    // Conserva una captura segura
    const nextEmail = String(value ?? '').slice(0, emailMaxLength);
    setReceiptEmail(nextEmail);
    setReceiptEmailError((currentError) => (
      currentError ? getReceiptEmailError(nextEmail) : null
    ));
  };

  // Valida y normaliza al abandonar el campo
  const validateReceiptEmail = () => {
    // Normaliza la captura vigente
    const normalizedEmail = normalizeReceiptEmail(receiptEmail);
    // Obtiene el error vigente
    const nextError = isWalkIn
      ? getReceiptEmailError(normalizedEmail)
      : null;
    setReceiptEmail(normalizedEmail);
    setReceiptEmailError(nextError);

    // Devuelve el resultado de validación
    return nextError === null;
  };

  // Produce el correo listo para la solicitud
  const buildReceiptEmail = () => {
    // Omite el correo dentro de una cita
    if (!isWalkIn) {
      // Devuelve ausencia intencional
      return undefined;
    }

    // Normaliza el valor final
    const normalizedEmail = normalizeReceiptEmail(receiptEmail);
    // Comprueba el valor final
    const nextError = getReceiptEmailError(normalizedEmail);
    setReceiptEmail(normalizedEmail);
    setReceiptEmailError(nextError);

    // Detiene el cobro con un correo inválido
    if (nextError) {
      throw new Error(nextError);
    }

    // Devuelve el correo o su ausencia
    return normalizedEmail || undefined;
  };

  // Limpia solo el mensaje visible
  const clearReceiptEmailError = () => {
    setReceiptEmailError(null);
  };

  // Devuelve el contrato del ticket opcional
  return {
    buildReceiptEmail,
    clearReceiptEmailError,
    receiptEmail,
    receiptEmailError,
    updateReceiptEmail,
    validateReceiptEmail
  };
};
