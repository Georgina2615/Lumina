import { FiLoader, FiSave } from 'react-icons/fi';
import { useRetailProductForm } from '../hooks/UseRetailProductForm';
import InventoryDialogShell from './InventoryDialogShell';
import RetailProductFormFields from './RetailProductFormFields';

// Coordina el alta y la edición comercial
export default function RetailProductFormModal({
  busy,
  categories,
  error,
  onClose,
  onSubmit,
  open,
  product
}) {
  const {
    creating,
    form,
    imageFile,
    imagePreview,
    selectImageFile,
    submitForm,
    updateField,
    validationError
  } = useRetailProductForm({ onSubmit, product });

  // Devuelve el formulario dentro del diálogo compartido
  return (
    <InventoryDialogShell
      busy={busy}
      description={creating
        ? undefined
        : 'La cantidad y el costo de compra se cambian por separado'}
      eyebrow="Productos para venta"
      focusKey={product?.id ?? 'new-product'}
      onClose={onClose}
      open={open}
      title={creating ? 'Nuevo producto' : 'Editar producto'}
      wide
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submitForm();
        }}
      >
        <div className="p-5 sm:p-6">
          <RetailProductFormFields
            categories={categories}
            creating={creating}
            form={form}
            imageFile={imageFile}
            imagePreview={imagePreview}
            onFieldChange={updateField}
            onImageChange={selectImageFile}
            product={product}
          />
          {(validationError || error) && (
            <p
              className="mt-5 rounded-xl border border-error/20 bg-error/10 px-4 py-3 text-sm font-medium text-error"
              role="alert"
            >
              {validationError || error}
            </p>
          )}
        </div>
        <footer className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-surface-hover bg-background/95 p-4 backdrop-blur sm:flex-row sm:justify-end">
          <button
            className="min-h-11 rounded-xl border border-surface-hover px-5 text-sm font-semibold text-primary transition hover:bg-surface-hover/50 disabled:opacity-50"
            disabled={busy}
            onClick={onClose}
            type="button"
          >
            Cancelar
          </button>
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-surface shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 disabled:cursor-wait disabled:opacity-60"
            disabled={busy}
            type="submit"
          >
            {busy ? (
              <FiLoader aria-hidden="true" className="motion-safe:animate-spin" />
            ) : (
              <FiSave aria-hidden="true" />
            )}
            {busy ? 'Guardando' : creating ? 'Crear producto' : 'Guardar cambios'}
          </button>
        </footer>
      </form>
    </InventoryDialogShell>
  );
}
