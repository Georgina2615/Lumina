export const clientInvoiceRegimeOptions = Object.freeze([
  { value: '601', label: 'General de Ley Personas Morales' },
  { value: '603', label: 'Personas Morales con Fines no Lucrativos' },
  { value: '605', label: 'Sueldos y salarios' },
  { value: '606', label: 'Arrendamiento' },
  { value: '607', label: 'Enajenación o adquisición de bienes' },
  { value: '608', label: 'Demás ingresos' },
  { value: '610', label: 'Residentes en el extranjero' },
  { value: '611', label: 'Ingresos por dividendos' },
  { value: '612', label: 'Actividades empresariales y profesionales' },
  { value: '614', label: 'Ingresos por intereses' },
  { value: '615', label: 'Ingresos por premios' },
  { value: '616', label: 'Sin obligaciones fiscales' },
  { value: '621', label: 'Incorporación Fiscal' },
  { value: '625', label: 'Actividades mediante plataformas tecnológicas' },
  { value: '626', label: 'Régimen Simplificado de Confianza' }
]);

export const clientInvoiceUseOptions = Object.freeze([
  { value: 'G03', label: 'Gastos en general' },
  { value: 'G01', label: 'Adquisición de mercancías' },
  { value: 'G02', label: 'Devoluciones descuentos o bonificaciones' },
  { value: 'S01', label: 'Sin efectos fiscales' },
  { value: 'CP01', label: 'Pagos' }
]);

const taxIdPattern = /^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/;
const emailPattern = /^[^/@\s]+@[^/@\s]+\.[^/@\s]+$/;

// Crea los datos iniciales del formulario
export const createClientInvoiceForm = (email = '') => ({
  deliveryEmail: email,
  invoiceUse: 'G03',
  postalCode: '',
  taxId: '',
  taxpayerName: '',
  taxRegime: ''
});

// Valida los datos antes de enviarlos al servidor
export const validateClientInvoiceForm = (form, saleId) => {
  const taxId = form.taxId.trim().toUpperCase();
  const taxpayerName = form.taxpayerName.trim();
  const postalCode = form.postalCode.trim();
  const deliveryEmail = form.deliveryEmail.trim().toLowerCase();

  if (!taxIdPattern.test(taxId)) {
    throw new Error('Escribe un RFC válido');
  }
  if (taxpayerName.length < 2 || taxpayerName.length > 200) {
    throw new Error('Escribe el nombre fiscal completo');
  }
  if (!/^\d{5}$/.test(postalCode)) {
    throw new Error('Escribe un código postal de cinco dígitos');
  }
  if (!clientInvoiceRegimeOptions.some(({ value }) => value === form.taxRegime)) {
    throw new Error('Selecciona el régimen fiscal');
  }
  if (!clientInvoiceUseOptions.some(({ value }) => value === form.invoiceUse)) {
    throw new Error('Selecciona el uso de la factura');
  }
  if (!emailPattern.test(deliveryEmail)) {
    throw new Error('Escribe un correo válido');
  }

  return {
    deliveryEmail,
    invoiceUse: form.invoiceUse,
    postalCode,
    saleId,
    taxId,
    taxpayerName,
    taxRegime: form.taxRegime
  };
};
