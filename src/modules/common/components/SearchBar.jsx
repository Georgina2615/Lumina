import { FiSearch } from 'react-icons/fi';

export default function SearchBar({ value, onChange, placeholder = "Buscar..." }) {
  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <FiSearch className="text-muted" />
      </div>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full pl-10 p-3 rounded-xl border border-surface-hover bg-surface focus:outline-none focus:border-primary transition-colors text-sm"
      />
    </div>
  );
}