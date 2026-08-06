import { PublicLegalPage } from '../components';

// Define las reglas vigentes de cancelacion
const cancellationSections = [
  {
    id: 'cliente',
    title: 'Cancelación solicitada por la clienta',
    paragraphs: [
      'Si la clienta decide cancelar la cita el anticipo no se devuelve ni se utiliza para reservar otra cita',
      'Al registrar la cancelación el horario vuelve a estar disponible para que otra persona pueda reservarlo'
    ]
  },
  {
    id: 'inasistencia',
    title: 'Ausencia y tiempo de espera',
    paragraphs: [
      'Lumina Skin esperará hasta quince minutos después de la hora acordada',
      'Si la clienta no llega durante ese tiempo la cita se registrará como ausencia el horario se liberará y el anticipo no se devolverá'
    ]
  },
  {
    id: 'lumina',
    title: 'Cancelación realizada por Lumina Skin',
    paragraphs: [
      'Si Lumina Skin necesita cancelar la cita la clienta conservará el importe completo de su anticipo',
      'Ese importe podrá utilizarse para reservar un nuevo horario sin volver a pagar la misma cantidad'
    ]
  },
  {
    id: 'reprogramacion',
    title: 'Elección de un nuevo servicio',
    paragraphs: [
      'La reprogramación con el anticipo anterior está disponible únicamente cuando Lumina Skin realizó la cancelación',
      'Si el nuevo servicio requiere un anticipo mayor solo se solicitará la diferencia necesaria antes de confirmar la nueva cita'
    ]
  },
  {
    id: 'calendario',
    title: 'Registro en el calendario',
    paragraphs: [
      'Las citas canceladas permanecen en el historial para conservar un registro claro de lo ocurrido pero dejan de ocupar el horario',
      'Recepción registrará si la cancelación fue solicitada por la clienta o realizada por Lumina Skin junto con el motivo correspondiente'
    ]
  },
  {
    id: 'solicitud',
    title: 'Cómo solicitar una cancelación',
    paragraphs: [
      'La cancelación puede solicitarse por WhatsApp al 981 101 7687 o directamente en recepción',
      'La solicitud se considerará registrada cuando el personal de Lumina Skin confirme que la cita fue cancelada'
    ]
  },
  {
    id: 'alcance',
    title: 'Aclaraciones y alcance académico',
    paragraphs: [
      'Para cualquier aclaración puedes comunicarte al 981 101 7687 o escribir a luminask01@gmail.com',
      'Lumina Skin es un prototipo académico creado por Joely Balam Reyes Las actualizaciones de esta política se mostrarán en esta misma dirección'
    ]
  }
];

// Presenta la politica de cancelacion publica
export default function CancellationPolicyPage() {
  // Devuelve las reglas vigentes
  return (
    <PublicLegalPage
      sections={cancellationSections}
      summary="Conoce qué sucede con el horario y el anticipo cuando una cita se cancela o la clienta no asiste"
      title="Política de cancelación"
      updatedAt="6 de agosto de 2026"
    />
  );
}
