import AppointmentCard from './AppointmentCard';
import KanbanAppointmentActions from './KanbanAppointmentActions';
import KanbanColumn from './KanbanColumn';

// Define la presentación de cada columna
const columnPresentation = [
  {
    key: 'pending',
    title: 'Por confirmar',
    titleColor: 'text-status-pending',
    emptyMessage: 'Sin citas pendientes en las próximas veinticuatro horas'
  },
  {
    key: 'confirmed',
    title: 'Confirmadas hoy',
    titleColor: 'text-status-confirmed',
    emptyMessage: 'No hay citas confirmadas para hoy'
  },
  {
    key: 'inCabin',
    title: 'En cabina',
    titleColor: 'text-status-incabin',
    emptyMessage: 'Ninguna clienta se encuentra en cabina'
  },
  {
    key: 'checkout',
    title: 'Por cobrar',
    titleColor: 'text-secondary',
    emptyMessage: 'No hay citas pendientes de cobro'
  }
];

// Presenta las columnas y acciones del tablero
export default function ReceptionKanbanBoard({
  appointmentsByColumn,
  contactsByClientId,
  isProcessingAppointment,
  onCancel,
  onConfirm,
  onMoveToCabin,
  onMoveToCheckout,
  onNoShow,
  onOpenCheckout,
  onOpenClientDirectory
}) {
  // Devuelve la composición horizontal del tablero
  return (
    <div className="flex flex-1 gap-6 overflow-x-auto pb-4">
      {columnPresentation.map((column) => (
        <KanbanColumn count={appointmentsByColumn[column.key].length}
          emptyMessage={column.emptyMessage} key={column.key}
          title={column.title} titleColor={column.titleColor}>
          {appointmentsByColumn[column.key].map((appointment) => (
            <AppointmentCard appointment={appointment}
              clientContact={contactsByClientId[appointment.clienteId]}
              key={appointment.id}
              onOpenClientDirectory={onOpenClientDirectory}>
              <KanbanAppointmentActions appointment={appointment}
                isProcessing={isProcessingAppointment(appointment.id)}
                onCancel={() => onCancel(appointment.id)}
                onConfirm={() => onConfirm(appointment.id)}
                onMoveToCabin={() => onMoveToCabin(appointment.id)}
                onMoveToCheckout={() => onMoveToCheckout(appointment.id)}
                onNoShow={() => onNoShow(appointment.id)}
                onOpenCheckout={() => onOpenCheckout(appointment.id)} />
            </AppointmentCard>
          ))}
        </KanbanColumn>
      ))}
    </div>
  );
}
