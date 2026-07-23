import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase'; 

export const useClients = () => {
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorLocal, setErrorLocal] = useState(null);

  // 1.Se trae el directorio en tiempo real, pero solo lectura
  useEffect(() => {
    const clientesRef = collection(db, 'clientes');
    // Ordenamos por fechaRegistro, los más nuevos primero
    const consulta = query(clientesRef, orderBy('fechaRegistro', 'desc'));

    const desuscribir = onSnapshot(consulta, (snapshot) => {
      const listaClientes = snapshot.docs.map(documento => ({
        id: documento.id,
        ...documento.data()
      }));
      setClientes(listaClientes);
      setCargando(false);
    }, (error) => {
      console.error("Error al cargar el directorio:", error);
      setErrorLocal("Error al cargar la base de datos de clientes.");
      setCargando(false);
    });

    return () => desuscribir();
  }, []);

  // 2. Edición restringido solo se edita teléfono y correo
  const actualizarContacto = async (clienteId, datosContacto) => {
    try {
      const clienteRef = doc(db, 'clientes', clienteId);
      
      // Si se trata de editar se ignoran.
      const { telefono, email } = datosContacto;
      
      await updateDoc(clienteRef, {
        telefono,
        email
      });
      
      return true;
    } catch (error) {
      console.error("Error al actualizar datos de contacto:", error);
      throw new Error("No se pudieron actualizar los datos del cliente.");
    }
  };

  return { clientes, cargando, errorLocal, actualizarContacto };
};