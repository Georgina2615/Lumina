import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';

export const useReceptionCalendar = () => {
  const [citasCalendario, setCitasCalendario] = useState([]);
  const [cargandoCalendario, setCargandoCalendario] = useState(true);

  // Consulta en tiempo real: Se sincronizará automáticamente con el Kanban
  useEffect(() => {
    const citasRef = collection(db, 'citas');
    const consulta = query(citasRef, where("estado", "!=", "cancelada")); 

    const desuscribir = onSnapshot(consulta, (snapshot) => {
      const citasFormateadas = snapshot.docs.map(documento => {
        const data = documento.data();
        // Armamos la fecha inicial
        const fechaInicio = new Date(`${data.fecha}T${data.hora}:00`);
        
        // Calculamos la fecha fin (Ej. 3 horas de duración para la vista del calendario)
        const fechaFin = new Date(fechaInicio.getTime() + (3 * 60 * 60 * 1000)); 

        return {
          id: documento.id,
          title: `${data.nombreCompleto} - ${data.servicio}`, 
          start: fechaInicio,
          end: fechaFin,
          estado: data.estado,
          ...data
        };
      });

      setCitasCalendario(citasFormateadas);
      setCargandoCalendario(false);
    });

    return () => desuscribir();
  }, []);

  const cancelarCita = async (citaId) => {
    try {
      const citaRef = doc(db, 'citas', citaId);
      await updateDoc(citaRef, { estado: 'cancelada' });
      // Al actualizar a "cancelada", el onSnapshot de arriba la desaparecerá del calendario
      // y también desaparecerá del Kanban automáticamente.
      return true; 
    } catch (error) {
      console.error("Error al cancelar la cita:", error);
      throw error;
    }
  };

  return { citasCalendario, cargandoCalendario, cancelarCita };
};