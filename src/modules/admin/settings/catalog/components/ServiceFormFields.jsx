const inputClassName = 'mt-1.5 min-h-11 w-full rounded-xl border border-surface-hover bg-background px-3 text-sm text-primary outline-none transition placeholder:text-muted/60 focus:border-secondary focus:ring-2 focus:ring-secondary/15';
const labelClassName = 'text-xs font-semibold text-muted';

// Presenta los datos editables del servicio
export default function ServiceFormFields({
  form,
  onFieldChange
}) {
  // Devuelve los campos comerciales del catalogo
  return (
    <div className="space-y-5">
      <label className={`block ${labelClassName}`}>
        Nombre del servicio
        <input
          autoComplete="off"
          className={inputClassName}
          maxLength={120}
          minLength={2}
          onChange={(event) => onFieldChange('name', event.target.value)}
          placeholder="Limpieza facial profunda"
          required
          value={form.name}
        />
      </label>

      <label className={`block ${labelClassName}`}>
        Descripción pública
        <span className="ml-2 font-normal text-muted">Opcional</span>
        <textarea
          className={`${inputClassName} min-h-28 resize-y py-3`}
          maxLength={500}
          onChange={(event) => onFieldChange(
            'publicDescription',
            event.target.value
          )}
          placeholder="Explica brevemente para quién es y qué beneficio ofrece"
          value={form.publicDescription}
        />
      </label>

      <label className={`block max-w-sm ${labelClassName}`}>
        Precio final con IVA
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 mt-0.5 -translate-y-1/2 text-sm text-muted">
            $
          </span>
          <input
            className={`${inputClassName} pl-7`}
            inputMode="decimal"
            max="1000000"
            min="0.01"
            onChange={(event) => onFieldChange('price', event.target.value)}
            placeholder="0.00"
            required
            step="0.01"
            type="number"
            value={form.price}
          />
        </div>
      </label>
    </div>
  );
}
