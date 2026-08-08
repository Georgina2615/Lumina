// Convierte un producto interno en información comercial segura
export const mapPublicProduct = (snapshot) => {
  const data = snapshot?.exists ? snapshot.data() : null;
  if (
    data?.schemaVersion !== 1
    || data.activo !== true
    || typeof data.nombre !== 'string'
    || !data.nombre.trim()
    || typeof data.categoria !== 'string'
    || !data.categoria.trim()
    || !Number.isSafeInteger(data.precioCentavos)
    || data.precioCentavos <= 0
    || !Number.isSafeInteger(data.existencias)
    || data.existencias < 0
  ) return null;

  return {
    available: data.existencias > 0,
    brand: String(data.marca ?? '').trim(),
    category: data.categoria.trim(),
    description: String(data.descripcion ?? '').trim(),
    id: snapshot.id,
    imageUrl: String(data.imagenUrl ?? '').trim(),
    name: data.nombre.trim(),
    priceCents: data.precioCentavos
  };
};

// Ordena productos para una lectura estable
export const sortPublicProducts = (products) => [...products].sort(
  (first, second) => (
    Number(second.available) - Number(first.available)
    || first.category.localeCompare(second.category, 'es')
    || first.name.localeCompare(second.name, 'es')
  )
);
