import { FiTrash2, FiShoppingCart } from 'react-icons/fi';

export default function POSCart({
  carrito, 
  subtotal, 
  descuentoAnticipo, 
  iva, 
  total,
  removerDelCarrito, 
  onAbrirCobro, 
  clienteNombre
}) {
  return (
    <div className="flex flex-col h-full bg-surface rounded-2xl border border-surface-hover shadow-sm overflow-hidden relative">
      
      {/* Cabecera del Ticket */}
      <div className="p-5 border-b border-surface-hover bg-primary text-surface flex justify-between items-center">
        <div>
          <h2 className="font-title font-bold text-lg flex items-center gap-2">
            <FiShoppingCart /> Orden Actual
          </h2>
          <p className="text-xs text-surface/80 mt-1 uppercase tracking-wider">
            Cliente: <span className="font-bold">{clienteNombre}</span>
          </p>
        </div>
        <span className="bg-surface text-primary text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
          {carrito.length} Items
        </span>
      </div>

      {/* Lista de Items en el Carrito */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {carrito.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted italic text-sm">
            <FiShoppingCart className="text-4xl mb-2 opacity-20" />
            <p>El carrito está vacío.</p>
            <p className="text-xs mt-1 font-body">Selecciona productos del catálogo.</p>
          </div>
        ) : (
          carrito.map((item, index) => (
            <div key={`${item.id}-${index}`} className="flex justify-between items-center p-3 border border-surface-hover rounded-xl bg-background hover:border-primary/30 transition-colors">
              <div className="flex-1 pr-3">
                <h4 className="font-semibold text-primary text-sm leading-tight mb-1">{item.nombre}</h4>
                <p className="text-xs text-muted font-medium">
                  {item.cantidad} x ${item.precio.toFixed(2)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-primary">${(item.precio * item.cantidad).toFixed(2)}</span>
                
                {/* LÓGICA SENIOR: Si es un servicio de cita, no dejamos borrarlo. Si es producto, sí. */}
                {!item.esServicio ? (
                  <button
                    onClick={() => removerDelCarrito(item.id)}
                    className="text-muted hover:text-error transition-colors p-1.5 hover:bg-error/10 rounded-lg"
                    title="Remover"
                  >
                    <FiTrash2 />
                  </button>
                ) : (
                  <span className="text-[10px] uppercase bg-status-confirmed/10 text-status-confirmed px-2 py-1 rounded-md font-bold tracking-wider border border-status-confirmed/20">
                    Cita
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desglose Matemático Financiero */}
      <div className="p-5 bg-background border-t border-surface-hover flex flex-col gap-3 text-sm">
        <div className="flex justify-between text-muted font-medium">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        
        {/* Solo aparece si realmente hay un descuento por anticipo */}
        {descuentoAnticipo > 0 && (
          <div className="flex justify-between text-status-confirmed font-bold bg-status-confirmed/10 p-2 rounded-lg -mx-2 px-2 border border-status-confirmed/20">
            <span>Anticipo Pagado (30%)</span>
            <span>-${descuentoAnticipo.toFixed(2)}</span>
          </div>
        )}
        
        <div className="flex justify-between text-muted font-medium">
          <span>IVA (16%)</span>
          <span>${iva.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between items-end mt-2 pt-3 border-t border-surface-hover">
          <span className="font-title font-bold text-primary tracking-widest uppercase">TOTAL</span>
          <span className="font-title font-bold text-3xl text-primary">${total.toFixed(2)}</span>
        </div>
      </div>

      {/* Botón Gigante de Cobro */}
      <div className="p-4 bg-background border-t border-surface-hover">
        <button
          onClick={onAbrirCobro}
          disabled={carrito.length === 0}
          className={`w-full py-4 rounded-xl font-bold text-lg uppercase tracking-widest transition-all shadow-sm flex justify-center items-center gap-2 ${
            carrito.length === 0
              ? 'bg-surface-hover text-muted cursor-not-allowed'
              : 'bg-primary text-surface hover:opacity-90 hover:-translate-y-1 hover:shadow-lg'
          }`}
        >
          Ir a Pagar
        </button>
      </div>
      
    </div>
  );
}