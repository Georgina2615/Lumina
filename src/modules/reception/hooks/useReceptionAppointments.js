import { useState } from 'react';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../config/firebase';

export const useReceptionAppointments = () => {
  const [cargando, setCargando] = useState(false);
  const [errorLocal, setErrorLocal] = useState(null);
  const [exito, setExito] = useState(false);

  // BÚSQUEDA EXACTA SOLO POR TELÉFONO
  const buscarCliente = async (telefono) => {
    try {
      const clientesRef = collection(db, 'clientes');
      const consulta = query(clientesRef, where('telefono', '==', telefono));
      const snapshot = await getDocs(consulta);

      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() };
      }
      return null;
    } catch (error) {
      console.error("Error en búsqueda:", error);
      return null;
    }
  };

  const agendarCitaPresencial = async (datosCliente, datosCita) => {
    setCargando(true);
    setErrorLocal(null);
    setExito(false);

    // VALIDACIONES BÁSICAS
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(datosCliente.nombreCompleto)) {
      setErrorLocal("El nombre no debe contener números.");
      setCargando(false); return;
    }
    if (!/^\d{10}$/.test(datosCliente.telefono)) {
      setErrorLocal("El teléfono debe tener 10 dígitos exactos.");
      setCargando(false); return;
    }
    if (!datosCliente.email || datosCliente.email.trim() === "") {
      setErrorLocal("El correo electrónico es obligatorio.");
      setCargando(false); return;
    }

    const fechaSeleccionada = new Date(`${datosCita.fecha}T12:00:00`); 
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); 

    if (fechaSeleccionada < hoy) {
      setErrorLocal("No puedes agendar citas en días pasados.");
      setCargando(false); return;
    }
    if (fechaSeleccionada.getDay() === 0) { 
      setErrorLocal("No se labora los días Domingo.");
      setCargando(false); return;
    }

    try {
      const citasRef = collection(db, 'citas');
      const qEmpalme = query(
        citasRef, 
        where('fecha', '==', datosCita.fecha), 
        where('hora', '==', datosCita.hora)
      );
      const snapEmpalme = await getDocs(qEmpalme);
      
      const citasActivas = snapEmpalme.docs.filter(doc => doc.data().estado !== 'cancelada');
      
      if (citasActivas.length > 0) {
        setErrorLocal("Horario no disponible. Ya hay una cita agendada a esa hora.");
        setCargando(false); return;
      }

      // GUARDADO 
      let clienteId = datosCliente.id;
      if (!clienteId) {
        const nuevoCliente = {
          nombreCompleto: datosCliente.nombreCompleto,
          telefono: datosCliente.telefono,
          email: datosCliente.email,
          consentimientoFirmado: false, 
          fechaRegistro: serverTimestamp()
        };
        const docRef = await addDoc(collection(db, 'clientes'), nuevoCliente);
        clienteId = docRef.id;
      }

      const nuevaCita = {
        clienteId: clienteId,
        nombreCompleto: datosCliente.nombreCompleto, 
        servicio: datosCita.servicio,
        fecha: datosCita.fecha, 
        hora: datosCita.hora,   
        estado: "confirmada", 
        anticipoPagado: false, 
        recordatorioEnviado: false
      };

      await addDoc(collection(db, 'citas'), nuevaCita);
      setExito(true);

    } catch (error) {
      console.error("Error al agendar:", error);
      setErrorLocal("Error de conexión. Intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  };

  return { buscarCliente, agendarCitaPresencial, cargando, errorLocal, exito };
};