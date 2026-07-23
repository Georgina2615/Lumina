import { useState } from 'react'; 
import { Outlet } from 'react-router-dom';
import { LoginModal } from '../../auth/components';
import { PublicHeader, PublicFooter } from '../../public/components';

export default function PublicLayout() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background text-primary font-body relative">
      
      {/* Modal de Autenticación */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />

      {/* Header Público */}
      <PublicHeader onOpenLoginModal={() => setIsLoginModalOpen(true)} />

      {/* Contenido Dinámico (LandingPage, Catálogo, etc.) */}
      <main className="flex-1 w-full">
        <Outlet />
      </main>

      {/* Footer Público */}
      <PublicFooter />

    </div>
  );
}