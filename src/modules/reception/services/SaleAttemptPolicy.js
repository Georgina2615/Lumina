// Enumera errores que permiten corregir la solicitud
const definitiveSaleErrorCodes = new Set([
  'functions/already-exists',
  'functions/failed-precondition',
  'functions/invalid-argument',
  'functions/not-found',
  'functions/out-of-range',
  'functions/permission-denied',
  'functions/unauthenticated',
  'functions/unimplemented'
]);

// Normaliza texto para búsquedas locales
export const normalizeSearchText = (value) => (
  String(value ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('es')
);

// Inmoviliza la solicitud enviada por primera vez
export const freezeSaleRequest = (request) => Object.freeze({
  ...request,
  payments: Object.freeze(request.payments.map(
    (payment) => Object.freeze({ ...payment })
  )),
  productItems: Object.freeze(request.productItems.map(
    (item) => Object.freeze({ ...item })
  ))
});

// Inmoviliza la presentación asociada al primer envío
export const freezeSaleView = ({
  cartItems,
  paymentForm,
  totals
}) => Object.freeze({
  cartItems: Object.freeze(cartItems.map(
    (item) => Object.freeze({ ...item })
  )),
  paymentForm: Object.freeze({ ...paymentForm }),
  totals: Object.freeze({ ...totals })
});

// Decide si una respuesta permite reemplazar la solicitud
export const canReleaseSaleRequest = (error) => {
  // Obtiene el código original de Firebase
  const errorCode = error?.cause?.code || error?.code;

  // Devuelve solo errores con resultado definitivo
  return definitiveSaleErrorCodes.has(errorCode);
};
