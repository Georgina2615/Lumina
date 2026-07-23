import { useState } from 'react';
// Importamos nuestras joyas arquitectónicas del módulo common
import { SearchBar, ProductCard } from '../../common/components';
import { FiPlus } from 'react-icons/fi';

// MOCK DATA: Estructurado exactamente como lo harás en Firebase después.
// Cuando tengas el Admin, solo borrarás esto y pondrás un Hook que traiga la info.
const PRODUCTOS_MOCK = [
  { 
    id: 'p1', 
    nombre: 'Sérum Ácido Hialurónico 2%', 
    precio: 450, 
    categoria: 'SkinCare',
    descripcion: 'Hidratación profunda que rellena líneas de expresión. Ideal para uso diario y nocturno.',
    imagenUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500&q=80' 
  },
  { 
    id: 'p2', 
    nombre: 'Crema Hidratante Cerámidas', 
    precio: 380, 
    categoria: 'SkinCare',
    descripcion: 'Restaura la barrera natural de la piel. Textura ligera y rápida absorción sin sensación grasa.',
    imagenUrl: 'https://images.unsplash.com/photo-1617897903246-719242758050?w=500&q=80'
  },
  { 
    id: 'p3', 
    nombre: 'Protector Solar FPS 50+', 
    precio: 520, 
    categoria: 'Protección',
    descripcion: 'Toque seco, sin efecto mimo. Protección de amplio espectro UVA/UVB para el final de tus tratamientos.',
    imagenUrl: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=500&q=80'
  },
  { 
    id: 'p4', 
    nombre: 'Limpiador Facial Espumoso', 
    precio: 290, 
    categoria: 'Limpieza',
    descripcion: 'Elimina impurezas y maquillaje sin resecar la barrera de la piel. Para todo tipo de pieles.',
    imagenUrl: 'https://images.unsplash.com/photo-1556228720-1c2f682fea04?w=500&q=80'
  }
];

export default function POSCatalog({ agregarAlCarrito }) {
  const [busqueda, setBusqueda] = useState('');

  // Lógica del buscador conectada a nuestra barra común
  const productosFiltrados = PRODUCTOS_MOCK.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
    p.categoria.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-surface rounded-2xl border border-surface-hover shadow-sm overflow-hidden">
      
      {/* 1. SECCIÓN DE BÚSQUEDA (Reutilizable) */}
      <div className="p-4 border-b border-surface-hover bg-background/50">
        <SearchBar 
          value={busqueda} 
          onChange={(e) => setBusqueda(e.target.value)} 
          placeholder="Buscar sérums, cremas, protectores..." 
        />
      </div>

      {/* 2. CUADRÍCULA DE PRODUCTOS DINÁMICOS */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {productosFiltrados.map(producto => (
            <ProductCard 
              key={producto.id}
              producto={producto}
              
              /* AQUÍ ESTÁ LA MAGIA ARQUITECTÓNICA: 
                 Le inyectamos el botón con la función de agregar al carrito 
                 exclusiva del módulo de recepción. */
              actionButton={
                <button
                  onClick={() => agregarAlCarrito(producto)}
                  className="flex items-center gap-2 bg-primary/10 hover:bg-primary text-primary hover:text-surface px-4 py-2 rounded-lg font-bold text-sm transition-colors shadow-sm"
                >
                  <FiPlus /> Agregar
                </button>
              }
            />
          ))}
        </div>
        
        {/* Estado Vacío por si no encuentra el producto */}
        {productosFiltrados.length === 0 && (
          <div className="text-center text-muted italic mt-10 font-body">
            No se encontraron productos con ese término.
          </div>
        )}
      </div>

    </div>
  );
}