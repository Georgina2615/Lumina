const currencyFormatter = new Intl.NumberFormat('es-MX', {
  currency: 'MXN',
  style: 'currency'
});

// Convierte un producto real al contrato visual
export const mapRecommendedProduct = (snapshot) => {
  const data = snapshot.data();
  return {
    active: data.activo === true,
    brand: String(data.marca ?? ''),
    category: String(data.categoria ?? ''),
    id: snapshot.id,
    imageUrl: String(data.imagenUrl ?? ''),
    name: String(data.nombre ?? ''),
    priceCents: Number.isSafeInteger(data.precioCentavos) ? data.precioCentavos : 0,
    stock: Number.isSafeInteger(data.existencias) ? data.existencias : 0
  };
};

// Convierte un servicio real al contrato visual
export const mapRecommendedService = (snapshot) => {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    name: String(data.nombre ?? ''),
    priceCents: Number.isSafeInteger(data.precioCentavos) ? data.precioCentavos : 0
  };
};

// Filtra productos por texto visible
export const filterRecommendationProducts = (products, search) => {
  const term = String(search ?? '').trim().toLocaleLowerCase('es-MX');
  if (!term) return products;
  return products.filter((product) => (
    `${product.name} ${product.brand} ${product.category}`
      .toLocaleLowerCase('es-MX')
      .includes(term)
  ));
};

// Presenta un importe del catálogo
export const formatRecommendationPrice = (priceCents) => (
  currencyFormatter.format((priceCents ?? 0) / 100)
);

// Construye el contenido validado para guardar
export const buildCareRecommendationPayload = ({ fields, selectedProductIds }) => {
  const careInstructions = fields.careInstructions.trim().replace(/\s+/g, ' ');
  const productIds = [...selectedProductIds].sort();
  if (careInstructions.length > 2000) throw new Error('Los cuidados en casa son demasiado largos');
  if (productIds.length > 8) throw new Error('Puedes recomendar hasta ocho productos');
  if (!careInstructions && !fields.nextVisitDate && !fields.serviceId && productIds.length === 0) {
    throw new Error('Agrega al menos una recomendación de cuidado');
  }
  return {
    careInstructions,
    nextVisitDate: fields.nextVisitDate,
    productIds,
    serviceId: fields.serviceId
  };
};
