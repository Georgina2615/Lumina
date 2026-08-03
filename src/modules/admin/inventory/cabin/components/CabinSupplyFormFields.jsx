import { cabinUnitOptions } from '../services/CabinInventoryPolicy';

const inputClassName = 'mt-1.5 min-h-11 w-full rounded-xl border border-surface-hover bg-background px-3 text-sm text-primary outline-none transition placeholder:text-muted/60 focus:border-secondary focus:ring-2 focus:ring-secondary/15';
const labelClassName = 'text-xs font-semibold text-muted';

// Presenta metadatos cantidades y costos iniciales
export default function CabinSupplyFormFields({
  categories,
  creating,
  form,
  onFieldChange
}) {
  const quantityStep = form.unit === 'pieza' ? '1' : '0.001';
  const quantityMaximum = form.unit === 'pieza'
    ? '999999999'
    : '999999.999';

  // Devuelve la captura completa del insumo
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClassName}>
          Nombre del insumo
          <input
            autoComplete="off"
            className={inputClassName}
            maxLength={120}
            onChange={(event) => onFieldChange('name', event.target.value)}
            placeholder="Ejemplo Ácido salicílico"
            required
            value={form.name}
          />
        </label>
        <label className={labelClassName}>
          Marca opcional
          <input
            autoComplete="off"
            className={inputClassName}
            maxLength={80}
            onChange={(event) => onFieldChange('brand', event.target.value)}
            placeholder="Proveedor o marca"
            value={form.brand}
          />
        </label>
      </div>

      <label className={`block ${labelClassName}`}>
        Categoría
        <input
          autoComplete="off"
          className={inputClassName}
          list="cabin-supply-categories"
          maxLength={80}
          onChange={(event) => onFieldChange('category', event.target.value)}
          placeholder="Ejemplo Activos cosméticos"
          required
          value={form.category}
        />
        <datalist id="cabin-supply-categories">
          {categories.map((category) => (
            <option key={category} value={category} />
          ))}
        </datalist>
      </label>

      <label className={`block ${labelClassName}`}>
        Descripción interna
        <textarea
          className={`${inputClassName} min-h-20 resize-y py-3`}
          maxLength={500}
          onChange={(event) => onFieldChange('description', event.target.value)}
          placeholder="Presentación concentración o indicaciones de almacén"
          value={form.description}
        />
        <span className="mt-1 block text-right text-[11px] font-normal text-muted">
          {form.description.length} de 500
        </span>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClassName}>
          Unidad de control
          {creating ? (
            <select
              className={inputClassName}
              onChange={(event) => onFieldChange('unit', event.target.value)}
              required
              value={form.unit}
            >
              <option value="">Selecciona una unidad</option>
              {cabinUnitOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <span className={`${inputClassName} flex items-center font-semibold`}>
              {cabinUnitOptions.find((option) => (
                option.value === form.unit
              ))?.label}
            </span>
          )}
        </label>
        <label className={labelClassName}>
          Alerta de stock mínimo
          <input
            className={inputClassName}
            inputMode="decimal"
            max={quantityMaximum}
            min="0"
            onChange={(event) => onFieldChange('minimumStock', event.target.value)}
            placeholder="0"
            required
            step={quantityStep}
            type="number"
            value={form.minimumStock}
          />
        </label>
      </div>

      {creating ? (
        <div className="grid gap-4 rounded-2xl border border-status-confirmed/25 bg-status-confirmed/10 p-4 sm:grid-cols-2">
          <label className={labelClassName}>
            Cantidad inicial
            <input
              className={inputClassName}
              disabled={!form.unit}
              inputMode="decimal"
              max={quantityMaximum}
              min={quantityStep}
              onChange={(event) => onFieldChange('initialQuantity', event.target.value)}
              placeholder="0"
              required
              step={quantityStep}
              type="number"
              value={form.initialQuantity}
            />
          </label>
          <label className={labelClassName}>
            Costo total de adquisición
            <input
              className={inputClassName}
              inputMode="decimal"
              max="10000000"
              min="0.01"
              onChange={(event) => onFieldChange('inventoryValue', event.target.value)}
              placeholder="0.00"
              required
              step="0.01"
              type="number"
              value={form.inventoryValue}
            />
          </label>
        </div>
      ) : (
        <div className="rounded-xl border border-status-incabin/25 bg-status-incabin/10 px-4 py-3 text-sm text-primary">
          La unidad, las existencias y el valor se modifican mediante movimientos auditados
        </div>
      )}
    </div>
  );
}
