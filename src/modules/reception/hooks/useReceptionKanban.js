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
      await updateDoc(citaRef, { estado: nuevoEstado });
    } catch (error) {
      console.error("Error al actualizar el estado en Firebase:", error);
      throw error;
    }
  };

  useEffect(() => {
    const hoy = new Date();
    const yyyy = hoy.getFullYear();
    const mm = String(hoy.getMonth() + 1).padStart(2, '0');
    const dd = String(hoy.getDate()).padStart(2, '0');
    const fechaHoyLocal = `${yyyy}-${mm}-${dd}`;

    const citasRef = collection(db, 'citas');

    // Por Confirmar (Cualquier fecha)
    const consultaPorConfirmar = query(citasRef, where("estado", "==", "por_confirmar"));
    const desuscribirPorConfirmar = onSnapshot(consultaPorConfirmar, (snapshot) => {
      const citas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCitasPorConfirmar(citas);
    });

    // Confirmadas (SOLO HOY)
    const consultaConfirmadas = query(
      citasRef,
      where("fecha", "==", fechaHoyLocal),
      where("estado", "==", "confirmada")
    );
    const desuscribirConfirmadas = onSnapshot(consultaConfirmadas, (snapshot) => {
      const citas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCitasConfirmadas(citas);
    });

    // En Cabina (SOLO HOY)
    const consultaEnCabina = query(
      citasRef,
      where("fecha", "==", fechaHoyLocal),
      where("estado", "==", "en_cabina")
    );
    const desuscribirEnCabina = onSnapshot(consultaEnCabina, (snapshot) => {
      const citas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCitasEnCabina(citas);
      setCargando(false); // Apagamos el loader cuando carga la última columna
    });

    return () => {
      desuscribirPorConfirmar();
      desuscribirConfirmadas();
      desuscribirEnCabina();
    };
  }, []);

  return { citasPorConfirmar, citasConfirmadas, citasEnCabina, cargando, actualizarEstadoCita };
};