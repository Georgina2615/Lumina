export default function ServiceCard({ servicio, actionButton }) {
  return (
    <div className="relative overflow-hidden group rounded-2xl border border-surface-hover bg-background shadow-sm hover:shadow-lg transition-all h-60 cursor-pointer">
      
      {/* Imagen estática de fondo */}
      <img
        src={servicio.imagenUrl || 'https://via.placeholder.com/300?text=Servicio'}
        alt={servicio.nombre}
        className="w-full h-full object-cover"
      />

      {/* Título base (visible siempre en la parte inferior si lo deseas, o lo dejamos todo en el panel que sube) */}
      <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent opacity-100 group-hover:opacity-0 transition-opacity duration-300 flex items-end p-4">
         <h3 className="text-surface font-title font-bold text-sm drop-shadow-md">{servicio.nombre}</h3>
      </div>

      {/* Panel Deslizante (Oculto abajo y sube tapando el 50%) */}
      <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-background/95 backdrop-blur-md p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex flex-col justify-between border-t border-surface-hover">
        <div>
          <h3 className="text-primary font-title font-bold text-sm mb-1 line-clamp-1">{servicio.nombre}</h3>
          <p className="text-muted font-body text-xs line-clamp-2">{servicio.descripcion}</p>
        </div>
        
        <div className="flex justify-between items-center mt-2">
          <span className="font-bold text-primary font-title">${servicio.precio.toFixed(2)}</span>
          {actionButton}
        </div>
      </div>

    </div>
  );
}