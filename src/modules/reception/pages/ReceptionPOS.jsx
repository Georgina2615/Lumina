import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePOS } from '../hooks';
import { POSCatalog, POSCart, POSCheckoutModal } from '../components';

export default function ReceptionPOS() {
  // 1. EL ENRUTAMIENTO INTELIGENTE
  const location = useLocation();
  const navigate = useNavigate();
  
  // Si venimos del Kanban, el botón nos mandó un estado con la cita. Si es mostrador, es null.
  const citaInicial = location.state?.cita || null;

  // 2. CONECTAMOS EL CEREBRO MATEMÁTICO
  const {
    carrito, subtotal, descuentoAnticipo, iva, total,
    agregarAlCarrito, removerDelCarrito, procesarVenta,
    procesando, errorVenta
  } = usePOS(citaInicial);

  const [modalAbierto, setModalAbierto] = useState(false);

  // 3. LA ACCIÓN DE COBRO FINAL
  const handleConfirmarPago = async (metodoPago) => {
    const ventaId = await procesarVenta(metodoPago);
    
    if (ventaId) {
      // Por ahora solo lanzamos una alerta de éxito. 
      // ¡AQUÍ ES DONDE METEREMOS EMAILJS EN EL SIGUIENTE PASO!
      alert(`¡Cobro exitoso registrado en base de datos!\nTicket ID: ${ventaId}`);
      
      setModalAbierto(false);
      // Regresamos al Kanban después de cobrar con éxito
      navigate('/dashboard/reception');
    }
  };

  return (
    <div className="flex flex-col h-full gap-4">
      
      {/* Encabezado de la página */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-title font-bold text-primary">Punto de Venta</h1>
          <p className="text-muted font-body mt-1">
            {citaInicial 
              ? `Cobro de cita: ${citaInicial.nombreCompleto}` 
              : 'Venta de Mostrador (Walk-in)'}
          </p>
        </div>
      </div>

      {errorVenta && (
        <div className="bg-error/10 text-error p-3 rounded-lg font-medium text-sm border border-error/20">
          {errorVenta}
        </div>
      )}

      {/* LAYOUT DIVIDIDO (Split Screen) */}
      <div className="flex-1 min-h-[600px] flex flex-col lg:flex-row gap-6 overflow-hidden pb-4">
        
        {/* Columna Izquierda: 60% Catálogo */}
        <div className="lg:w-[60%] h-[500px] lg:h-full">
          <POSCatalog agregarAlCarrito={agregarAlCarrito} />
        </div>

        {/* Columna Derecha: 40% Carrito */}
        <div className="lg:w-[40%] h-[500px] lg:h-full">
          <POSCart 
            carrito={carrito}
            subtotal={subtotal}
            descuentoAnticipo={descuentoAnticipo}
            iva={iva}
            total={total}
            removerDelCarrito={removerDelCarrito}
            onAbrirCobro={() => setModalAbierto(true)}
            clienteNombre={citaInicial ? citaInicial.nombreCompleto : 'Mostrador'}
          />
        </div>

      </div>

      {/* El Modal Oculto que espera a ser llamado */}
      <POSCheckoutModal 
        isOpen={modalAbierto} 
        onClose={() => setModalAbierto(false)} 
        onConfirm={handleConfirmarPago}
        total={total}
        procesando={procesando}
      />

    </div>
  );
}