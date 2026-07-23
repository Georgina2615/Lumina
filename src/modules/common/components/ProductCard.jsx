export default function ProductCard({ producto, actionButton }) {
  return (
    <div className="relative overflow-hidden group rounded-2xl border border-surface-hover bg-background shadow-sm hover:shadow-lg transition-all h-60 flex flex-col cursor-pointer">
      
      {/* Contenedor de Imagen con Efecto Zoom */}
      <div className="relative flex-1 overflow-hidden">
        <img
          src={producto.imagenUrl || 'https://via.placeholder.com/300?text=Producto'}
          alt={producto.nombre}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Overlay (Capa oscura) que aparece en Hover con el texto */}
        <div className="absolute inset-0 bg-primary/85 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-center items-center p-5 text-center">
          <h3 className="text-surface font-title font-bold text-sm mb-2">{producto.nombre}</h3>
          <p className="text-surface/80 text-xs font-body leading-relaxed line-clamp-3">
            {producto.descripcion}
          </p>
        </div>
      </div>

      {/* Footer Fijo: Precio y Botón Dinámico */}
      <div className="p-3 flex justify-between items-center bg-background z-10 border-t border-surface-hover">
        <span className="font-bold text-primary font-title">${producto.precio.toFixed(2)}</span>
        {/* Aquí inyectaremos el botón de Recepción o el de Admin */}
        {actionButton}
      </div>

    </div>
  );
}