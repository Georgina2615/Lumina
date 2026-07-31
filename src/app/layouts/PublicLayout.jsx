import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { LoginModal } from '../../modules/auth/components';
import { PublicHeader, PublicFooter } from '../../modules/public/components';

// Compone la experiencia pública de la aplicación
export default function PublicLayout() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Presenta la navegación el contenido y el acceso
  return (
    <div className="min-h-screen flex flex-col bg-background text-primary font-body relative">
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

      <PublicHeader onOpenLoginModal={() => setIsLoginModalOpen(true)} />

      <main className="flex-1 w-full">
        <Outlet />
      </main>

      <PublicFooter />
    </div>
  );
}
