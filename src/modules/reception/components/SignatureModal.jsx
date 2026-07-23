import { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { useSignature } from '../hooks';

export default function SignatureModal({ isOpen, onClose, clienteId }) {
  const sigCanvas = useRef(null);
  const { guardarFirmaDigital, guardandoFirma, errorFirma } = useSignature();

  if (!isOpen || !clienteId) return null;

  const handleLimpiar = () => {
    sigCanvas.current.clear();
  };

 const handleGuardar = async () => {
    try {
      if (!sigCanvas.current) return;

      if (sigCanvas.current.isEmpty()) {
        alert("Por favor, proporcione una firma en el lienzo antes de guardar.");
        return;
      }

      // Obtenemos la imagen 
      const firmaBase64 = sigCanvas.current.getCanvas().toDataURL('image/png');
      
      // Enviamos a Firebase
      const exito = await guardarFirmaDigital(clienteId, firmaBase64);
      
      if (exito) {
        onClose(); 
      }
    } catch (error) {
      console.error("Error al procesar la firma:", error);
      alert("Hubo un problema al procesar la firma. Intente nuevamente.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-sm">
      <div className="bg-background rounded-2xl max-w-lg w-full p-6 shadow-xl">
        
        <div className="flex justify-between items-center mb-4 border-b border-surface-hover pb-3">
          <h2 className="font-title font-bold text-xl text-primary">Firma de Consentimiento</h2>
          <button onClick={onClose} className="text-muted hover:text-error text-xl font-bold">✕</button>
        </div>
        
        <p className="text-sm text-muted mb-4 font-body">
          Al firmar este documento, el cliente acepta los términos y condiciones, así como los protocolos de salubridad de los tratamientos en Lumina Skin.
        </p>

        {/* El Lienzo de Firma */}
        <div className="border-2 border-dashed border-surface-hover rounded-xl overflow-hidden bg-white mb-4">
          <SignatureCanvas 
            ref={sigCanvas} 
            penColor="#2A2121" 
            canvasProps={{ className: "w-full h-48 cursor-crosshair touch-none" }} 
          />
        </div>

        {errorFirma && (
          <div className="text-error text-sm mb-4 bg-error/10 p-3 rounded-lg font-medium text-center">
            {errorFirma}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button 
            onClick={handleLimpiar} 
            disabled={guardandoFirma}
            className="px-4 py-2 text-sm font-medium border border-surface-hover text-muted rounded-lg hover:bg-surface-hover transition-colors"
          >
            Limpiar Lienzo
          </button>
          <button 
            onClick={handleGuardar} 
            disabled={guardandoFirma}
            className={`px-6 py-2 text-sm font-medium rounded-lg text-surface shadow-sm transition-colors ${
              guardandoFirma ? 'bg-surface-hover cursor-not-allowed' : 'bg-primary hover:opacity-90'
            }`}
          >
            {guardandoFirma ? "Guardando firma legal..." : "Guardar Firma"}
          </button>
        </div>

      </div>
    </div>
  );
}