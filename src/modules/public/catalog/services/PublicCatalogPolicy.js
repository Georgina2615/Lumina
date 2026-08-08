const currencyFormatter = new Intl.NumberFormat('es-MX', {
  currency: 'MXN',
  style: 'currency'
});

// Convierte centavos a una cantidad legible
export const formatCatalogPrice = (priceCents) => currencyFormatter.format(priceCents / 100);

// Valida el contrato recibido antes de mostrarlo
const normalizeProduct = (product) => {
  if (
    !product
    || typeof product.id !== 'string'
    || typeof product.name !== 'string'
    || typeof product.category !== 'string'
    || !Number.isSafeInteger(product.priceCents)
  ) return null;

  return {
    available: product.available === true,
    brand: String(product.brand ?? '').trim(),
    category: product.category.trim(),
    description: String(product.description ?? '').trim(),
    id: product.id,
    imageUrl: String(product.imageUrl ?? '').trim(),
    name: product.name.trim(),
    priceCents: product.priceCents
  };
};

// Conserva únicamente productos comerciales válidos
export const normalizePublicCatalog = (payload) => (
  Array.isArray(payload?.products)
    ? payload.products.map(normalizeProduct).filter(Boolean)
    : []
);

// Construye categorías sin valores repetidos
export const getCatalogCategories = (products) => [
  'Todos',
  ...new Set(products.map(({ category }) => category))
];

// Filtra productos mediante una categoría elegida
export const filterCatalogProducts = (products, selectedCategory) => (
  selectedCategory === 'Todos'
    ? products
    : products.filter(({ category }) => category === selectedCategory)
);
