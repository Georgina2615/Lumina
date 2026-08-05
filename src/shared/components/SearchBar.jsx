import { FiSearch } from 'react-icons/fi';

// Presenta una búsqueda con nombre accesible estable
export default function SearchBar({
  value,
  onChange,
  placeholder = 'Buscar',
  ariaLabel = 'Buscar'
}) {
  // Devuelve el campo reutilizable
  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <FiSearch aria-hidden="true" className="text-muted" />
      </div>
      <input
        type="search"
        aria-label={ariaLabel}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full pl-10 p-3 rounded-xl border border-surface-hover bg-surface focus:outline-none focus:border-primary transition-colors text-sm"
      />
    </div>
  );
}
