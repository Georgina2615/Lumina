import { FiLoader, FiSave } from 'react-icons/fi';
import SettingsDialogShell from '../../components/SettingsDialogShell';
import { useUserForm } from '../hooks/UseUserForm';
import UserFormFields from './UserFormFields';

export default function UserFormModal({ busy, error, onClearError, onClose, onSubmit, user }) {
  const {
    creating,
    form,
    submitForm,
    updateField,
    validationError
  } = useUserForm({ onSubmit, user });

  return (
    <SettingsDialogShell
      busy={busy}
      focusKey={user?.id ?? 'new-user'}
      onClose={onClose}
      title={creating ? 'Nueva cuenta' : 'Editar cuenta'}
      wide
    >
      <form
        aria-describedby={(validationError || error) ? 'user-form-error' : undefined}
        onSubmit={(event) => {
          event.preventDefault();
          submitForm();
        }}
      >
        <div className="p-5 sm:p-6">
          <UserFormFields
            form={form}
            onFieldChange={(field, value) => {
              updateField(field, value);
              onClearError();
            }}
          />
          {(validationError || error) && (
            <p
              className="mt-5 rounded-xl border border-error/20 bg-error/10 px-4 py-3 text-sm font-medium text-error"
              id="user-form-error"
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
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-surface shadow-sm transition motion-safe:hover:-translate-y-0.5 hover:shadow-md disabled:cursor-wait disabled:opacity-60"
            disabled={busy}
            type="submit"
          >
            {busy ? (
              <FiLoader aria-hidden="true" className="motion-safe:animate-spin" />
            ) : (
              <FiSave aria-hidden="true" />
            )}
            {busy ? 'Guardando' : creating ? 'Crear cuenta' : 'Guardar cambios'}
          </button>
        </footer>
      </form>
    </SettingsDialogShell>
  );
}
