import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';

export const useReceptionKanban = () => {
  const [citasPorConfirmar, setCitasPorConfirmar] = useState([]);
  const [citasConfirmadas, setCitasConfirmadas] = useState([]);
  const [citasEnCabina, setCitasEnCabina] = useState([]);
  const [cargando, setCargando] = useState(true);

  const actualizarEstadoCita = async (citaId, nuevoEstado) => {
    try {
      const citaRef = doc(db, 'citas', citaId);
      await updateDoc(citaRef, {
        estado: nuevoEstado
      });
    } catch (error) {
      console.error("Error al actualizar el estado en Firebase:", error);
      throw error;
    }
  };

  useEffect(() => {
    const hoy = new Date();
    const fechaHoy = hoy.toLocaleDateString('sv-SE');

    const citasRef = collection(db, 'citas');

    const consultaPorConfirmar = query(
      citasRef,
      where("estado", "==", "por_confirmar")
    );

    const desuscribirPorConfirmar = onSnapshot(consultaPorConfirmar, (snapshot) => {
      const citas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCitasPorConfirmar(citas);
    });

    const consultaConfirmadas = query(
      citasRef,
      where("fecha", "==", fechaHoy),
      where("estado", "==", "confirmada")
    );

    const desuscribirConfirmadas = onSnapshot(consultaConfirmadas, (snapshot) => {
      const citas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCitasConfirmadas(citas);
    });

    const consultaEnCabina = query(
      citasRef,
      where("fecha", "==", fechaHoy),
      where("estado", "==", "en_cabina")
    );

    const desuscribirEnCabina = onSnapshot(consultaEnCabina, (snapshot) => {
      const citas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCitasEnCabina(citas);
      
      setCargando(false);
    });

    return () => {
      desuscribirPorConfirmar();
      desuscribirConfirmadas();
      desuscribirEnCabina();
    };
  }, []);

  return {
    citasPorConfirmar,
    citasConfirmadas,
    citasEnCabina,
    cargando,
    actualizarEstadoCita 
  };
};