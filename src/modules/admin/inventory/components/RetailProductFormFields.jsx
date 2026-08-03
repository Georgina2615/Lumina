import RetailProductImageField from './RetailProductImageField';

const inputClassName = 'mt-1.5 min-h-11 w-full rounded-xl border border-surface-hover bg-background px-3 text-sm text-primary outline-none transition placeholder:text-muted/60 focus:border-secondary focus:ring-2 focus:ring-secondary/15';
const labelClassName = 'text-xs font-semibold text-muted';

// Presenta campos comerciales sin permitir editar existencias
export default function RetailProductFormFields({
  categories,
  creating,
  form,
  imageFile,
  imagePreview,
  onFieldChange,
  onImageChange,
  product
}) {
  // Devuelve la captura completa del catálogo
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClassName}>
          Nombre del producto
          <input
            autoComplete="off"
            className={inputClassName}
            maxLength={120}
            onChange={(event) => onFieldChange('name', event.target.value)}
            placeholder="Ejemplo Protector solar facial"
            required
            value={form.name}
          />
        </label>
        <label className={labelClassName}>
          Marca
          <input
            autoComplete="off"
            className={inputClassName}
            maxLength={80}
            onChange={(event) => onFieldChange('brand', event.target.value)}
            placeholder="Marca comercial"
            required
            value={form.brand}
          />
        </label>
      </div>

      <label className={`block ${labelClassName}`}>
        Categoría
        <input
          autoComplete="off"
          className={inputClassName}
          list="retail-product-categories"
          maxLength={80}
          onChange={(event) => onFieldChange('category', event.target.value)}
          placeholder="Ejemplo Protectores solares"
          required
          value={form.category}
        />
        <datalist id="retail-product-categories">
          {categories.map((category) => (
            <option key={category} value={category} />
          ))}
        </datalist>
      </label>

      <label className={`block ${labelClassName}`}>
        Descripción del producto
        <textarea
          className={`${inputClassName} min-h-24 resize-y py-3`}
          maxLength={500}
          onChange={(event) => onFieldChange('description', event.target.value)}
          placeholder="Beneficio principal presentación y contenido"
          value={form.description}
        />
        <span className="mt-1 block text-right text-[11px] font-normal text-muted">
          {form.description.length} de 500
        </span>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClassName}>
          Precio de venta con IVA
          <input
            className={inputClassName}
            inputMode="decimal"
            min="0.01"
            onChange={(event) => onFieldChange('price', event.target.value)}
            placeholder="0.00"
            required
            step="0.01"
            type="number"
            value={form.price}
          />
        </label>
        {creating ? (
          <label className={labelClassName}>
            Costo de compra por unidad
            <input
              className={inputClassName}
              inputMode="decimal"
              min="0.01"
              onChange={(event) => onFieldChange('acquisitionCost', event.target.value)}
              placeholder="0.00"
              required
              step="0.01"
              type="number"
              value={form.acquisitionCost}
            />
          </label>
        ) : (
          <div className="rounded-xl border border-surface-hover bg-surface px-3 py-2.5">
            <p className="text-xs font-semibold text-muted">Código del producto</p>
            <p className="mt-1 font-mono text-sm text-primary">{product.sku}</p>
          </div>
        )}
      </div>

      <div className={`grid gap-4 ${creating ? '' : 'sm:grid-cols-2'}`}>
        <label className={labelClassName}>
          Avisar cuando queden
          <input
            className={inputClassName}
            inputMode="numeric"
            max="99999"
            min="0"
            onChange={(event) => onFieldChange('minimumStock', event.target.value)}
            required
            step="1"
            type="number"
            value={form.minimumStock}
          />
        </label>
        {!creating && (
          <div className="rounded-xl border border-status-confirmed/25 bg-status-confirmed/10 px-3 py-2.5">
            <p className="text-xs font-semibold text-muted">
              Cantidad disponible
            </p>
            <p className="mt-1 text-sm font-semibold text-primary">
              Usa Agregar o Corregir para cambiar la cantidad
            </p>
          </div>
        )}
      </div>

      <RetailProductImageField
        imageFile={imageFile}
        imagePreview={imagePreview}
        onChange={onImageChange}
      />
    </div>
  );
}
