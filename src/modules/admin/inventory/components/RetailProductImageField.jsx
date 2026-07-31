import { FiImage, FiUploadCloud } from 'react-icons/fi';

// Permite seleccionar y previsualizar una imagen normalizada
export default function RetailProductImageField({
  imageFile,
  imagePreview,
  onChange
}) {
  // Devuelve un selector visual sin almacenar rutas locales
  return (
    <div className="rounded-2xl border border-surface-hover bg-surface p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex h-28 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl border border-surface-hover bg-background text-muted sm:w-28">
          {imagePreview ? (
            <img
              alt="Vista previa del producto"
              className="h-full w-full object-cover"
              src={imagePreview}
            />
          ) : (
            <FiImage aria-hidden="true" size={28} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <label
            className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-surface-hover bg-background px-4 text-sm font-semibold text-primary transition hover:border-secondary/40 hover:shadow-sm active:scale-[0.98]"
            htmlFor="retail-product-image"
          >
            <FiUploadCloud aria-hidden="true" />
            {imageFile ? 'Cambiar selección' : 'Seleccionar imagen'}
          </label>
          <input
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            id="retail-product-image"
            onChange={(event) => {
              onChange(event.target.files?.[0] ?? null);
              event.target.value = '';
            }}
            type="file"
          />
          <p className="mt-2 text-xs leading-relaxed text-muted">
            JPG PNG o WebP de hasta ocho megabytes
          </p>
          <p className="text-xs leading-relaxed text-muted">
            Se recortará al centro en formato cuadrado y se optimizará antes de subir
          </p>
          {imageFile && (
            <p className="mt-2 truncate text-xs font-semibold text-secondary">
              {imageFile.name}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
