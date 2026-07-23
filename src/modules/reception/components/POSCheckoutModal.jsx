import { useState } from 'react';
import { FiDollarSign, FiCreditCard, FiSmartphone } from 'react-icons/fi';

export default function POSCheckoutModal({ isOpen, onClose, onConfirm, total, procesando }) {
  const [metodoPago, setMetodoPago] = useState('Efectivo');

  if (!isOpen) return null;

  const metodos = [
    { id: 'Efectivo', icono: <FiDollarSign className="text-2xl mb-2" /> },
    { id: 'Tarjeta', icono: <FiCreditCard className="text-2xl mb-2" /> },
    { id: 'Transferencia', icono: <FiSmartphone className="text-2xl mb-2" /> }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-sm">
      <div className="bg-background rounded-2xl max-w-sm w-full p-6 shadow-xl">
        
        <div className="flex justify-between items-center mb-6 border-b border-surface-hover pb-3">
          <h2 className="font-title font-bold text-xl text-primary">Confirmar Pago</h2>
          <button onClick={onClose} disabled={procesando} className="text-muted hover:text-error text-xl font-bold">✕</button>
        </div>

        <div className="text-center mb-6">
          <p className="text-muted text-sm font-medium uppercase tracking-widest mb-1">Total a Cobrar</p>
          <p className="text-4xl font-title font-bold text-primary">${total.toFixed(2)}</p>
        </div>

        <p className="text-xs font-semibold text-muted mb-3 uppercase tracking-wider">Método de Pago</p>
        <div className="grid grid-cols-3 gap-3 mb-6">
          {metodos.map((metodo) => (
            <button
              key={metodo.id}
              onClick={() => setMetodoPago(metodo.id)}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                metodoPago === metodo.id 
                  ? 'border-primary bg-primary/10 text-primary shadow-sm' 
                  : 'border-surface-hover bg-surface text-muted hover:border-primary/50'
              }`}
            >
              {metodo.icono}
              <span className="text-xs font-bold">{metodo.id}</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => onConfirm(metodoPago)}
          disabled={procesando}
          className={`w-full py-3.5 rounded-xl font-bold text-lg transition-all shadow-sm flex justify-center items-center gap-2 ${
            procesando
              ? 'bg-surface-hover text-muted cursor-not-allowed'
              : 'bg-primary text-surface hover:opacity-90 hover:-translate-y-1 hover:shadow-lg'
          }`}
        >
          {procesando ? 'Procesando...' : `Cobrar $${total.toFixed(2)}`}
        </button>

      </div>
    </div>
  );
}