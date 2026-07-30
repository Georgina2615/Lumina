import { useMemo, useState } from 'react';
import { calculateSaleTotals } from '../services/SaleCalculationService';

// Limita líneas según la política remota
const maximumProductLines = 50;
// Limita unidades según la política remota
const maximumProductQuantity = 99;

// Convierte una cita válida en una línea protegida
const buildServiceItem = (appointment) => {
  // Descarta citas no cobrables
  if (!appointment || appointment.chargeIssue) {
    // Devuelve ausencia de servicio
    return null;
  }
  // Devuelve la línea protegida
  return {
    id: appointment.serviceId || appointment.id,
    type: 'service',
    name: appointment.serviceName,
    unitPriceCents: appointment.servicePriceCents,
    quantity: 1,
    available: true
  };
};

// Controla cantidades y cálculos del carrito
export const usePOSCart = ({ appointment, products }) => {
  // Conserva selecciones comerciales
  const [cartEntries, setCartEntries] = useState([]);
  // Conserva mensajes del carrito
  const [cartError, setCartError] = useState(null);
  // Indexa el catálogo vigente
  const productMap = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products]
  );
  // Une cantidades con datos vigentes
  const productItems = useMemo(() => cartEntries.map((entry) => {
    // Obtiene el producto más reciente
    const currentProduct = productMap.get(entry.productId);
    // Conserva datos visibles previos
    const product = currentProduct || entry.product;
    // Devuelve la línea comercial
    return {
      id: entry.productId,
      type: 'product',
      name: product.name,
      unitPriceCents: product.priceCents,
      quantity: entry.quantity,
      stock: currentProduct?.stock ?? 0,
      available: Boolean(
        currentProduct && currentProduct.stock >= entry.quantity
      )
    };
  }), [cartEntries, productMap]);
  // Construye la línea de servicio
  const serviceItem = useMemo(
    () => buildServiceItem(appointment),
    [appointment]
  );
  // Compone todas las líneas visibles
  const cartItems = useMemo(
    () => [...(serviceItem ? [serviceItem] : []), ...productItems],
    [productItems, serviceItem]
  );
  // Calcula importes enteros
  const totals = useMemo(() => calculateSaleTotals({
    items: cartItems,
    depositAmountCents: serviceItem
      ? appointment.depositAmountCents
      : 0
  }), [appointment, cartItems, serviceItem]);

  // Agrega una unidad respetando la existencia visible
  const addProduct = (product) => {
    // Obtiene la cantidad actual
    const currentQuantity = cartEntries.find(
      ({ productId }) => productId === product.id
    )?.quantity ?? 0;
    // Limita productos diferentes
    if (!currentQuantity && cartEntries.length >= maximumProductLines) {
      setCartError('La venta no puede superar cincuenta productos diferentes');
      // Detiene la línea adicional
      return;
    }
    // Limita unidades por línea
    if (currentQuantity >= maximumProductQuantity) {
      setCartError('La cantidad máxima por producto es noventa y nueve');
      // Detiene la unidad adicional
      return;
    }
    // Respeta la existencia disponible
    if (currentQuantity >= product.stock) {
      setCartError('No hay más unidades disponibles de este producto');
      // Detiene la unidad sin existencia
      return;
    }
    setCartEntries((current) => {
      // Obtiene el estado más reciente
      const currentEntry = current.find(
        ({ productId }) => productId === product.id
      );
      // Protege eventos simultáneos
      if (
        currentEntry
        && (
          currentEntry.quantity >= product.stock
          || currentEntry.quantity >= maximumProductQuantity
        )
      ) {
        // Conserva el carrito seguro
        return current;
      }
      // Devuelve el carrito actualizado
      return currentEntry
        ? current.map((entry) => (
          entry.productId === product.id
            ? { ...entry, quantity: entry.quantity + 1 }
            : entry
        ))
        : [...current, { productId: product.id, product, quantity: 1 }];
    });
    setCartError(null);
  };

  // Cambia la cantidad de una línea comercial
  const changeProductQuantity = (productId, difference) => {
    // Obtiene línea y producto vigentes
    const entry = cartEntries.find((item) => item.productId === productId);
    // Obtiene el producto vigente
    const product = productMap.get(productId);
    // Descarta líneas inexistentes
    if (!entry) {
      // Detiene la actualización
      return;
    }
    // Calcula la cantidad solicitada
    const requestedQuantity = entry.quantity + difference;
    // Respeta la existencia
    if (!product || requestedQuantity > product.stock) {
      setCartError('No hay más unidades disponibles de este producto');
      // Detiene la cantidad inválida
      return;
    }
    // Respeta el máximo por línea
    if (requestedQuantity > maximumProductQuantity) {
      setCartError('La cantidad máxima por producto es noventa y nueve');
      // Detiene la cantidad excesiva
      return;
    }
    setCartEntries((current) => {
      // Obtiene la línea más reciente
      const currentEntry = current.find(
        (item) => item.productId === productId
      );
      // Descarta cambios obsoletos
      if (!currentEntry) {
        // Conserva el carrito vigente
        return current;
      }
      // Calcula desde el estado vigente
      const nextQuantity = currentEntry.quantity + difference;
      // Elimina cantidades agotadas
      if (nextQuantity <= 0) {
        // Devuelve el carrito sin la línea
        return current.filter((item) => item.productId !== productId);
      }
      // Protege límites simultáneos
      if (
        nextQuantity > product.stock
        || nextQuantity > maximumProductQuantity
      ) {
        // Conserva el carrito seguro
        return current;
      }
      // Devuelve la cantidad actualizada
      return current.map((item) => (
        item.productId === productId
          ? { ...item, quantity: nextQuantity }
          : item
      ));
    });
    setCartError(null);
  };

  // Elimina una línea comercial completa
  const removeProduct = (productId) => {
    setCartEntries((current) => current.filter(
      (item) => item.productId !== productId
    ));
    setCartError(null);
  };

  // Devuelve acciones y cálculos del carrito
  return {
    addProduct,
    cartError,
    cartItems,
    changeProductQuantity,
    productItems,
    removeProduct,
    reportCartError: setCartError,
    totals
  };
};
