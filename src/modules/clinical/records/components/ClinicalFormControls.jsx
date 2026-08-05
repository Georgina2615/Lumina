const inputClassName = 'mt-2 min-h-11 w-full rounded-xl border border-surface-hover bg-background px-3 text-sm text-primary outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/15';

// Presenta un campo de texto o número
export const ClinicalInput = ({ label, ...inputProps }) => (
  <label className="block text-sm font-semibold text-muted">
    {label}
    <input className={inputClassName} {...inputProps} />
  </label>
);

// Presenta una selección controlada
export const ClinicalSelect = ({ label, options, ...selectProps }) => (
  <label className="block text-sm font-semibold text-muted">
    {label}
    <select className={inputClassName} {...selectProps}>
      {options.map((option) => {
        const [value, optionLabel] = Array.isArray(option)
          ? option
          : [option.value, option.label];

        return <option key={`${value}-${optionLabel}`} value={value}>{optionLabel}</option>;
      })}
    </select>
  </label>
);

// Presenta una respuesta extensa
export const ClinicalTextArea = ({ label, hint, ...textAreaProps }) => (
  <label className="block text-sm font-semibold text-muted">
    {label}
    <textarea
      className={`${inputClassName} min-h-24 resize-y py-3 leading-relaxed`}
      {...textAreaProps}
    />
    {hint && <span className="mt-1 block text-xs font-normal text-muted">{hint}</span>}
  </label>
);

// Presenta opciones múltiples fáciles de tocar
export const ClinicalCheckboxGroup = ({ label, onToggle, options, values }) => (
  <fieldset>
    <legend className="text-sm font-semibold text-muted">{label}</legend>
    <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {options.map(([value, optionLabel]) => {
        const checked = values.includes(value);

        return (
          <label
            className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-sm transition ${
              checked
                ? 'border-secondary/40 bg-secondary/10 text-primary'
                : 'border-surface-hover bg-background text-muted hover:border-secondary/30'
            }`}
            key={value}
          >
            <input
              checked={checked}
              className="h-4 w-4 accent-primary"
              onChange={() => onToggle(value)}
              type="checkbox"
            />
            {optionLabel}
          </label>
        );
      })}
    </div>
  </fieldset>
);
