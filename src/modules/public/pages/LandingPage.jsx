export default function LandingPage() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center p-8">
      <h1 className="text-5xl font-title font-bold text-primary mb-4">
        Lumina Skin
      </h1>
      <p className="text-xl font-body text-muted mb-8 max-w-md">
        Nuestro portal para clientas se está renovando para ofrecerte una mejor experiencia.
      </p>
      <div className="bg-surface p-6 rounded-2xl border border-surface-hover shadow-sm">
        <p className="font-medium text-text">
          ¿Eres personal de la clínica?
        </p>
        <p className="text-sm text-muted mt-2">
          Inicia sesión en el menú para acceder a tu panel.
        </p>
      </div>
    </div>
  );
}