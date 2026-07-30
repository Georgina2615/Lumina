import { useMemo, useRef, useState } from 'react';
import { finalizeReceptionSale } from '../services/SaleService';
import {
  clearSaleAttempt,
  readSaleAttempt,
  storeSaleAttempt
} from '../services/SaleAttemptStorage';
import {
  canReleaseSaleRequest,
  freezeSaleRequest,
  freezeSaleView,
  normalizeSearchText
} from '../services/SaleAttemptPolicy';
import { usePOSCart } from './UsePosCart';
import { usePOSData } from './UsePosData';
import { usePOSPayment } from './UsePosPayment';
import { usePOSReceipt } from './UsePosReceipt';

// Orquesta el flujo visual del punto de venta
export const usePOS = (appointmentId) => {
  // Recupera un intento pendiente de esta pestaña
  const [restoredSaleAttempt] = useState(
    () => readSaleAttempt(appointmentId)
  );
  // Conecta datos y carrito separados
  const data = usePOSData(appointmentId);
  // Conecta operaciones del carrito
  const cart = usePOSCart({
    appointment: data.appointment,
    products: data.products
  });
  // Conserva estados propios del flujo
  const [searchQuery, setSearchQuery] = useState('');
  // Conserva errores del cobro
  const [checkoutError, setCheckoutError] = useState(null);
  // Conserva visibilidad del cobro
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  // Conserva estado de escritura
  const [processing, setProcessing] = useState(false);
  // Conserva la venta confirmada
  const [saleResult, setSaleResult] = useState(null);
  // Conserva la presentación del primer envío
  const [frozenSaleView, setFrozenSaleView] = useState(() => (
    restoredSaleAttempt
      ? freezeSaleView(restoredSaleAttempt.view)
      : null
  ));
  // Conserva protecciones del intento
  const submitLockRef = useRef(false);
  // Conserva la clave idempotente
  const idempotencyKeyRef = useRef(
    restoredSaleAttempt?.request.idempotencyKey ?? null
  );
  // Conserva la solicitud exacta del primer envío
  const saleRequestRef = useRef(
    restoredSaleAttempt
      ? freezeSaleRequest(restoredSaleAttempt.request)
      : null
  );

  // Conserva la misma operación durante toda la pantalla
  if (idempotencyKeyRef.current === null) {
    idempotencyKeyRef.current = crypto.randomUUID();
  }

  // Determina el importe estable del cobro
  const checkoutAmountDueCents = frozenSaleView?.totals.amountDueCents
    ?? cart.totals.amountDueCents;
  // Detecta una solicitud pendiente de respuesta definitiva
  const hasFrozenSaleRequest = frozenSaleView !== null;
  // Conecta la captura de pagos
  const payment = usePOSPayment(
    checkoutAmountDueCents,
    frozenSaleView?.paymentForm
  );
  // Conecta el correo opcional del ticket
  const receipt = usePOSReceipt({
    isWalkIn: !appointmentId,
    restoredReceiptEmail: frozenSaleView?.receiptEmail
      ?? restoredSaleAttempt?.request?.receiptEmail
      ?? ''
  });

  // Filtra catálogo sin alterar datos
  const filteredProducts = useMemo(() => {
    // Normaliza el término capturado
    const searchValue = normalizeSearchText(searchQuery);
    // Devuelve todo sin búsqueda
    if (!searchValue) {
      // Conserva el catálogo completo
      return data.products;
    }
    // Devuelve coincidencias tolerantes
    return data.products.filter((product) => (
      normalizeSearchText(product.name).includes(searchValue)
      || normalizeSearchText(product.category).includes(searchValue)
    ));
  }, [data.products, searchQuery]);

  // Determina problemas de cita
  const appointmentIssue = appointmentId
    ? data.appointmentError
      || (!data.appointmentLoading && !data.appointment
        ? 'No encontramos la cita solicitada'
        : data.appointment?.chargeIssue)
    : null;
  // Detecta líneas sin disponibilidad
  const unavailableItem = cart.productItems.find((item) => !item.available);
  // Consolida bloqueos del cobro
  const checkoutIssue = appointmentIssue
    || (unavailableItem
      ? `${unavailableItem.name} ya no tiene existencias suficientes`
      : null)
    || (!appointmentId && cart.productItems.length === 0
      ? 'Agrega al menos un producto para la venta de mostrador'
      : null)
    || (cart.totals.amountDueCents <= 0
      ? 'La venta no tiene saldo pendiente'
      : null);

  // Abre la captura con la clave conservada
  const openCheckout = () => {
    // Bloquea una venta incompleta
    if (
      !hasFrozenSaleRequest
      && (checkoutIssue || data.productsLoading || data.appointmentLoading)
    ) {
      cart.reportCartError(checkoutIssue || 'Espera a que termine la carga');
      // Detiene la apertura inválida
      return;
    }
    // Limpia pagos solo antes del primer envío
    if (!hasFrozenSaleRequest) {
      payment.resetPayment();
    }
    setCheckoutError(null);
    receipt.clearReceiptEmailError();
    setSaleResult(null);
    setCheckoutOpen(true);
  };

  // Cierra una captura que no está escribiendo
  const closeCheckout = () => {
    // Protege una escritura activa
    if (processing) {
      // Conserva el modal visible
      return;
    }
    setCheckoutOpen(false);
    setCheckoutError(null);
    receipt.clearReceiptEmailError();
    // Conserva los pagos de una respuesta incierta
    if (!hasFrozenSaleRequest) {
      payment.resetPayment();
    }
  };

  // Envía una sola solicitud idempotente
  const confirmSale = async () => {
    // Evita solicitudes duplicadas
    if (submitLockRef.current || processing) {
      // Detiene el intento repetido
      return;
    }
    // Bloquea datos inválidos antes del primer envío
    if (!saleRequestRef.current && checkoutIssue) {
      setCheckoutError(checkoutIssue);
      // Detiene una solicitud nueva inválida
      return;
    }
    submitLockRef.current = true;
    setProcessing(true);
    setCheckoutError(null);
    try {
      // Recupera la solicitud pendiente
      let saleRequest = saleRequestRef.current;
      // Construye la solicitud únicamente una vez
      if (!saleRequest) {
        // Valida el correo antes de inmovilizar la venta
        const receiptEmail = receipt.buildReceiptEmail();
        // Inmoviliza identificadores cantidades y pagos
        saleRequest = freezeSaleRequest({
          appointmentId: data.appointment?.id ?? null,
          idempotencyKey: idempotencyKeyRef.current,
          payments: payment.buildPayments(),
          productItems: cart.productItems.map((item) => ({
            productId: item.id,
            quantity: item.quantity
          })),
          ...(receiptEmail ? { receiptEmail } : {})
        });
        saleRequestRef.current = saleRequest;
        // Inmoviliza la presentación del intento
        const saleView = freezeSaleView({
          cartItems: cart.cartItems,
          paymentForm: payment.paymentForm,
          receiptEmail: receiptEmail ?? '',
          totals: cart.totals
        });
        setFrozenSaleView(saleView);
        storeSaleAttempt(appointmentId, {
          request: saleRequest,
          view: saleView
        });
      }
      // Reutiliza la misma solicitud en cada reintento
      const result = await finalizeReceptionSale(saleRequest);
      clearSaleAttempt(appointmentId);
      setSaleResult(result);
    } catch (error) {
      // Libera datos solo ante un rechazo definitivo
      if (canReleaseSaleRequest(error)) {
        saleRequestRef.current = null;
        idempotencyKeyRef.current = crypto.randomUUID();
        setFrozenSaleView(null);
        clearSaleAttempt(appointmentId);
      }
      setCheckoutError(error.message || 'No se pudo registrar el cobro');
    } finally {
      submitLockRef.current = false;
      setProcessing(false);
    }
  };

  // Compone el error vigente dentro del diálogo
  const checkoutModalError = checkoutError || (
    checkoutOpen && !hasFrozenSaleRequest ? checkoutIssue : null
  );

  // Devuelve contratos separados para la vista
  return {
    ...data,
    ...cart,
    appointmentIssue,
    cartItems: frozenSaleView?.cartItems ?? cart.cartItems,
    checkoutAmountDueCents,
    checkoutIssue,
    checkoutModalError,
    checkoutOpen,
    closeCheckout,
    confirmSale,
    filteredProducts,
    hasFrozenSaleRequest,
    openCheckout,
    payment,
    processing,
    receipt,
    saleResult,
    searchQuery,
    setSearchQuery,
    totals: frozenSaleView?.totals ?? cart.totals
  };
};
