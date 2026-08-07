import { PublicLegalPage } from '../components';

// Define las condiciones para utilizar los servicios
const termsSections = [
  {
    id: 'aceptacion',
    title: 'Aceptación de las condiciones',
    paragraphs: [
      'Estas condiciones explican cómo funcionan las citas, los pagos y los servicios ofrecidos por Lumina Skin.',
      'Antes de completar una reservación, se solicitará que la persona lea y acepte estas condiciones y el aviso de privacidad.'
    ]
  },
  {
    id: 'servicios',
    title: 'Servicios estéticos',
    paragraphs: [
      'Lumina Skin ofrece tratamientos de cuidado facial con fines estéticos. Estos servicios no sustituyen una consulta, un diagnóstico ni un tratamiento médico.',
      'Los resultados pueden variar según la piel, los hábitos y el seguimiento de cada persona. No se prometen resultados idénticos para todas las clientas.'
    ]
  },
  {
    id: 'personas',
    title: 'Quién puede solicitar una cita',
    paragraphs: [
      'El servicio está dirigido únicamente a personas mayores de dieciocho años.',
      'La clienta deberá proporcionar información verdadera y actualizada para recibir avisos y preparar su atención de forma adecuada.'
    ]
  },
  {
    id: 'reservacion',
    title: 'Reservación y anticipo',
    paragraphs: [
      'La reservación requiere un anticipo equivalente al treinta por ciento del precio del servicio elegido.',
      'En las citas solicitadas por internet, el anticipo se procesará mediante Mercado Pago. La reservación se registrará cuando el pago sea aprobado.',
      'El anticipo forma parte del pago total del servicio y no se considera un descuento.'
    ]
  },
  {
    id: 'precios',
    title: 'Precios y comprobantes',
    paragraphs: [
      'Los precios se muestran en pesos mexicanos e incluyen IVA.',
      'Antes de confirmar una operación, se mostrará el importe correspondiente. Lumina Skin enviará al correo registrado la información de la cita.'
    ]
  },
  {
    id: 'atencion',
    title: 'Antes y durante la atención',
    paragraphs: [
      'La cosmetóloga podrá solicitar información sobre alergias, antecedentes, hábitos y productos utilizados para valorar si el tratamiento es adecuado.',
      'Antes del procedimiento, la clienta deberá revisar y firmar el consentimiento informado. Si existe una condición que requiera atención médica, el servicio estético podrá detenerse o no realizarse.'
    ]
  },
  {
    id: 'cambios',
    title: 'Cambios y cancelaciones',
    paragraphs: [
      'Las cancelaciones, reprogramaciones, retrasos y ausencias se atenderán conforme a la Política de cancelación disponible en este sitio.',
      'Si Lumina Skin necesita cancelar una cita, el anticipo se conservará para elegir un nuevo horario.'
    ]
  },
  {
    id: 'sitio',
    title: 'Uso del sitio',
    paragraphs: [
      'No está permitido utilizar el sitio para proporcionar información falsa, afectar reservaciones ajenas, intentar acceder a información de otras personas o alterar su funcionamiento.',
      'Si ocurre una falla técnica, Lumina Skin buscará conservar la información ya registrada y ofrecer un medio de contacto para resolver la solicitud.'
    ]
  },
  {
    id: 'alcance',
    title: 'Contacto y alcance académico',
    paragraphs: [
      'Para aclaraciones, puedes comunicarte al 981 101 7687 o escribir a luminask01@gmail.com.',
      'Lumina Skin es un prototipo académico creado por Joely Balam Reyes. Las actualizaciones de estas condiciones se mostrarán en esta misma dirección.'
    ]
  }
];

// Presenta los terminos y condiciones publicos
export default function TermsConditionsPage() {
  // Devuelve las condiciones vigentes
  return (
    <PublicLegalPage
      sections={termsSections}
      summary="Consulta de forma sencilla las condiciones de las citas, los pagos y la atención estética en Lumina Skin."
      title="Términos y condiciones"
      updatedAt="6 de agosto de 2026"
    />
  );
}
