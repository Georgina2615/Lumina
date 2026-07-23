import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';

export const useSignature = () => {
  const [guardandoFirma, setGuardandoFirma] = useState(false);
  const [errorFirma, setErrorFirma] = useState(null);

  // Guardado de firma y validación
  const guardarFirmaDigital = async (clienteId, firmaBase64) => {
    setGuardandoFirma(true);
    setErrorFirma(null);

    try {
      const clienteRef = doc(db, 'clientes', clienteId);
      
      // Se actualiza el cambio de estado y la fecha legal exacta
      await updateDoc(clienteRef, {
        consentimientoFirmado: true,
        firmaUrl: firmaBase64,
        fechaFirma: new Date().toISOString() 
      });

      setGuardandoFirma(false);
      return true;
    } catch (error) {
      console.error("Error crítico al guardar la firma legal:", error);
      setErrorFirma("Hubo un error de conexión al encriptar y guardar la firma. Intente nuevamente.");
      setGuardandoFirma(false);
      return false;
    }
  };

  return { guardarFirmaDigital, guardandoFirma, errorFirma };
};