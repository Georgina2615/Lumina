import { useState } from 'react';
// IMPORTANTE: Agregamos 'or' a las importaciones de Firebase
import { collection, query, where, getDocs, addDoc, serverTimestamp, or } from 'firebase/firestore';
import { db } from '../../../config/firebase';

export const useReceptionAppointments = () => {
  const [cargando, setCargando] = useState(false);
  const [errorLocal, setErrorLocal] = useState(null);
  const [exito, setExito] = useState(false);

  // BÚSQUEDA MÚLTIPLE (Teléfono, Email o Nombre Exacto)
  const buscarCliente = async (termino) => {
    try {
      const clientesRef = collection(db, 'clientes');
      
      // La magia de Firebase 9+: Buscar por cualquiera de los 3 campos
      const consulta = query(
        clientesRef, 
        or(
          where('telefono', '==', termino),
          where('email', '==', termino),
          where('nombreCompleto', '==', termino) // Ojo: Debe escribirse exacto, respetando mayúsculas
        )
      );
      
      const snapshot = await getDocs(consulta);

      if (!snapshot.empty) {
        const doc = snapshot.docs[0]; // Tomamos el primer resultado
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

    // 1. Validaciones de formato
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

    // 2. Validaciones de Fecha
    // Se usa T12:00:00 para evitar que el cambio de zona horaria lo mueva de día
    const fechaSeleccionada = new Date(`${datosCita.fecha}T12:00:00`); 
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); // Llevamos "hoy" a la medianoche para comparar correctamente

    if (fechaSeleccionada < hoy) {
      setErrorLocal("No puedes agendar citas en días pasados.");
      setCargando(false); return;
    }
    if (fechaSeleccionada.getDay() === 0) { 
      setErrorLocal("No laboramos los días Domingo.");
      setCargando(false); return;
    }

    try {
      // 3. Validación de Empalme (Misma hora y fecha)
      const citasRef = collection(db, 'citas');
      const qEmpalme = query(
        citasRef, 
        where('fecha', '==', datosCita.fecha), 
        where('hora', '==', datosCita.hora)
      );
      const snapEmpalme = await getDocs(qEmpalme);
      
      // Verificamos que la cita empalmada no esté cancelada
      const citasActivas = snapEmpalme.docs.filter(doc => doc.data().estado !== 'cancelada');
      
      if (citasActivas.length > 0) {
        setErrorLocal(`Horario ocupado. Ya existe una cita a las ${datosCita.hora}.`);
        setCargando(false); return;
      }

      // 4. Guardado Seguro
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
        estado: "confirmada", // Pasa directo a confirmada como acordamos
        anticipoPagado: false, 
        recordatorioEnviado: false
      };

      await addDoc(collection(db, 'citas'), nuevaCita);
      setExito(true);

    } catch (error) {
      console.error("Error al agendar:", error);
      setErrorLocal("Error de conexión. Revisa tu internet e intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  };

  return { buscarCliente, agendarCitaPresencial, cargando, errorLocal, exito };
};