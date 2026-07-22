import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';

export const useReceptionCalendar = () => {
  const [citasCalendario, setCitasCalendario] = useState([]);
  const [cargandoCalendario, setCargandoCalendario] = useState(true);

  // Consulta en tiempo real
  useEffect(() => {
    const citasRef = collection(db, 'citas');
    const consulta = query(citasRef, where("estado", "!=", "cancelada")); 

    const desuscribir = onSnapshot(consulta, (snapshot) => {
      const citasFormateadas = snapshot.docs.map(documento => {
        const data = documento.data();
        const fechaInicio = new Date(`${data.fecha}T${data.hora}:00`);
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
      return true; // 
    } catch (error) {
      console.error("Error al cancelar la cita:", error);
      throw error;
    }
  };

  return { 
    citasCalendario, 
    cargandoCalendario, 
    cancelarCita 
  };
};