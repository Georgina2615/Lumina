import { PublicLegalPage } from '../components';

// Define el contenido vigente del aviso
const privacySections = [
  {
    id: 'responsable',
    title: 'Responsable de los datos',
    paragraphs: [
      'Lumina Skin, con domicilio en Avenida Adolfo López Mateos 426, Campeche, Campeche, es responsable del uso de los datos proporcionados dentro de este prototipo académico.',
      'Las solicitudes relacionadas con la privacidad pueden enviarse a luminask01@gmail.com.'
    ]
  },
  {
    id: 'datos',
    title: 'Datos que podemos utilizar',
    paragraphs: ['Solo solicitamos información relacionada con la atención estética y la organización de la cita.'],
    items: [
      'Nombre, teléfono, correo electrónico y datos de contacto.',
      'Servicio, fecha, horario, estado de la cita y datos del anticipo.',
      'Método de pago, referencia y últimos cuatro dígitos cuando correspondan, sin almacenar datos completos de tarjeta.',
      'Antecedentes, alergias, hábitos, rutina facial, observaciones, firmas y fotografías de seguimiento.',
      'Identificadores de acceso y comprobaciones técnicas de seguridad.'
    ]
  },
  {
    id: 'sensibles',
    title: 'Información clínica sensible',
    paragraphs: [
      'La ficha técnica, el seguimiento, las fotografías y el consentimiento informado pueden revelar información sensible sobre la salud o la condición de la piel.',
      'Estos datos se utilizan únicamente para brindar y documentar la atención estética. Su uso requiere una autorización expresa durante la atención clínica.'
    ]
  },
  {
    id: 'finalidades',
    title: 'Para qué utilizamos los datos',
    paragraphs: ['La información se utiliza para las siguientes actividades necesarias:'],
    items: [
      'Registrar, confirmar, reprogramar o cancelar citas.',
      'Reservar horarios y comprobar anticipos o pagos.',
      'Preparar la atención estética y conservar el seguimiento por sesión.',
      'Gestionar consentimientos, insumos y recomendaciones de cuidado.',
      'Enviar confirmaciones, recordatorios y comprobantes digitales.',
      'Prevenir accesos indebidos, resolver errores y proteger la información.'
    ]
  },
  {
    id: 'marketing',
    title: 'Ofertas y comunicaciones opcionales',
    paragraphs: [
      'El envío de promociones, ofertas o contenido comercial requerirá una autorización separada y opcional.',
      'Negarse a recibir publicidad no impedirá agendar una cita ni recibir mensajes necesarios sobre el servicio.'
    ]
  },
  {
    id: 'proveedores',
    title: 'Servicios tecnológicos',
    paragraphs: [
      'Lumina Skin utiliza servicios tecnológicos externos para guardar información, proteger el acceso al sistema, publicar el sitio y enviar correos relacionados con las citas y los comprobantes.',
      'Estos proveedores solo intervienen para permitir el funcionamiento del sistema. Lumina Skin no vende datos personales ni los comparte con fines comerciales ajenos.'
    ]
  },
  {
    id: 'conservacion',
    title: 'Cuidado y conservación de la información',
    paragraphs: [
      'La información se conservará únicamente durante el tiempo necesario para atender a la clienta, mantener su historial y cumplir con las finalidades descritas en este aviso.',
      'Lumina Skin limita el acceso a la información según las actividades de cada integrante del personal. También utiliza medidas de seguridad para evitar consultas, cambios o usos no autorizados.'
    ]
  },
  {
    id: 'derechos',
    title: 'Derechos sobre tus datos',
    paragraphs: [
      'Puedes solicitar el acceso, la corrección o la eliminación de tus datos, o bien oponerte a su uso. También puedes retirar autorizaciones opcionales mediante un correo a luminask01@gmail.com con tu nombre, medio de contacto y una descripción clara de la solicitud.',
      'Cuando sea necesario, se solicitará información razonable para confirmar que la petición pertenece a la persona titular.'
    ]
  },
  {
    id: 'alcance',
    title: 'Alcance académico y actualizaciones',
    paragraphs: [
      'Lumina Skin es un prototipo académico creado por Joely Balam Reyes. Este documento presenta el uso de datos previsto para su demostración.',
      'El servicio está diseñado para personas mayores de dieciocho años. Las modificaciones futuras del aviso se publicarán en esta misma dirección.'
    ]
  }
];

// Presenta el aviso de privacidad publico
export default function PrivacyNoticePage() {
  // Devuelve el documento vigente
  return (
    <PublicLegalPage
      sections={privacySections}
      summary="Conoce qué información utiliza Lumina Skin, cómo la protege y qué decisiones puedes tomar sobre tus datos."
      title="Aviso de privacidad"
      updatedAt="6 de agosto de 2026"
    />
  );
}
