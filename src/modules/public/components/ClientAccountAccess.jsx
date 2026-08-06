import { FcGoogle } from 'react-icons/fc';
import { FiLock } from 'react-icons/fi';

// Presenta el acceso seguro para clientas
export default function ClientAccountAccess({ connecting, error, onConnect }) {
  return (
    <div className="mx-auto max-w-xl rounded-[2rem] border border-surface-hover bg-surface p-7 text-center shadow-xl shadow-primary/5 sm:p-10">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-status-pending/15 text-secondary">
        <FiLock aria-hidden="true" size={24} />
      </span>
      <h2 className="mt-5 text-3xl">Consulta tus citas</h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted">
        Usa la cuenta de Google que tenga el mismo correo registrado en Lumina Skin
      </p>
      {error && (
        <p className="mt-5 rounded-2xl bg-error/10 px-4 py-3 text-sm text-error" role="alert">
          {error}
        </p>
      )}
      <button className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-full border border-surface-hover bg-background px-6 font-semibold text-primary transition hover:border-secondary/40 hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-60" disabled={connecting} onClick={onConnect} type="button">
        {!connecting && <FcGoogle aria-hidden="true" size={23} />}
        {connecting ? 'Conectando' : 'Continuar con Google'}
      </button>
      <p className="mt-4 text-xs leading-5 text-muted">
        Solo podrás ver las citas relacionadas con tu propio correo
      </p>
    </div>
  );
}
