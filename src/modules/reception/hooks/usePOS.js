import { useState, useMemo } from 'react';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../config/firebase';

export const usePOS = (citaInicial = null) => {
  // 1. ESTADO DEL CARRITO
  // Si nos mandaron una cita desde el Kanban, metemos su servicio al carrito automáticamente.
  const [carrito, setCarrito] = useState(() => {
    if (citaInicial) {
      return [{
        id: 'servicio-base', // ID temporal para el servicio
        nombre: citaInicial.servicio,
        precio: citaInicial.precioServicio || 1000, // Precio base (puedes ajustarlo luego)
        cantidad: 1,
        esServicio: true
      }];
    }
    return []; // Si es Walk-in (Mostrador), el carrito empieza vacío
  });

  const [procesando, setProcesando] = useState(false);
  const [errorVenta, setErrorVenta] = useState(null);

  // 2. MATEMÁTICA AUTOMÁTICA RECTIVA (useMemo)
  const subtotal = useMemo(() => {
    return carrito.reduce((acumulador, item) => acumulador + (item.precio * item.cantidad), 0);
  }, [carrito]);

  const descuentoAnticipo = useMemo(() => {
    // Si viene de una cita y ya pagó anticipo, calculamos el 30% del servicio base
    if (citaInicial?.anticipoPagado) {
      const servicio = carrito.find(item => item.esServicio);
      if (servicio) {
        return servicio.precio * 0.30; 
      }
    }
    return 0; // Walk-ins o citas sin anticipo no tienen descuento
  }, [carrito, citaInicial]);

  const iva = useMemo(() => {
    // El IVA (16%) se calcula sobre el subtotal YA aplicando el descuento
    return (subtotal - descuentoAnticipo) * 0.16;
  }, [subtotal, descuentoAnticipo]);

  const total = useMemo(() => {
    return subtotal - descuentoAnticipo + iva;
  }, [subtotal, descuentoAnticipo, iva]);

  // 3. ACCIONES DEL CARRITO
  const agregarAlCarrito = (producto) => {
    setCarrito(prev => {
      // Si el producto ya está en el carrito, solo le sumamos 1 a la cantidad
      const existe = prev.find(item => item.id === producto.id);
      if (existe) {
        return prev.map(item => 
          item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item
        );
      }
      // Si no existe, lo agregamos nuevo
      return [...prev, { ...producto, cantidad: 1 }];
    });
  };

  const removerDelCarrito = (id) => {
    setCarrito(prev => prev.filter(item => item.id !== id));
  };

  // 4. TRANSACCIÓN A FIREBASE (El Cobro)
  const procesarVenta = async (metodoPago) => {
    if (carrito.length === 0) return null;
    
    setProcesando(true);
    setErrorVenta(null);

    try {
      const nuevaVenta = {
        cliente: citaInicial ? citaInicial.nombreCompleto : "Mostrador",
        clienteId: citaInicial ? citaInicial.clienteId : null,
        citaId: citaInicial ? citaInicial.id : null,
        items: carrito,
        desglose: {
          subtotal,
          descuento: descuentoAnticipo,
          iva,
          total
        },
        metodoPago, // 'Efectivo', 'Tarjeta', 'Transferencia'
        fecha: serverTimestamp(),
      };

      // A. Guardamos el ticket en la colección de ventas
      const ventaRef = await addDoc(collection(db, 'ventas'), nuevaVenta);

      // B. Si es el Flujo B (Cita), actualizamos el estado de la cita en el Kanban
      if (citaInicial) {
        const citaRef = doc(db, 'citas', citaInicial.id);
        await updateDoc(citaRef, { estado: 'finalizada' });
      }

      setProcesando(false);
      return ventaRef.id; // Retornamos el ID de la venta por si lo usamos después

    } catch (error) {
      console.error("Error al procesar la venta:", error);
      setErrorVenta("No se pudo procesar el cobro de Firebase. Verifica tu conexión.");
      setProcesando(false);
      return null;
    }
  };

  return {
    carrito, subtotal, descuentoAnticipo, iva, total, // Variables matemáticas
    agregarAlCarrito, removerDelCarrito, procesarVenta, // Funciones de acción
    procesando, errorVenta // Estados de UI
  };
};