import { useState } from 'react';
import { useClients } from '../hooks';
import { ClientTable, ClientProfileModal, SignatureModal } from '../components';

// Presenta el directorio de clientes de recepción
export default function ReceptionClientDirectory() {
  // Conecta los datos reales del directorio
  const {
    clientes: clients,
    cargando: loading,
    errorLocal: error,
    actualizarContacto: updateContact
  } = useClients();

  // Controla el cliente y los diálogos activos
  const [activeClient, setActiveClient] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSignatureOpen, setIsSignatureOpen] = useState(false);

  // Abre el perfil del cliente seleccionado
  const openProfile = (client) => {
    setActiveClient(client);
    setIsProfileOpen(true);
  };

  // Abre la firma del cliente seleccionado
  const openSignature = (client) => {
    setActiveClient(client);
    setIsSignatureOpen(true);
  };

  // Presenta la carga inicial
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center font-body text-muted">
        Cargando directorio de clientes
      </div>
    );
  }

  // Presenta el error de lectura
  if (error) {
    return (
      <div className="flex h-full items-center justify-center font-body text-error" role="alert">
        {error}
      </div>
    );
  }

  // Compone la experiencia adaptable del directorio
  return (
    <div className="relative flex min-h-full flex-col gap-6 md:h-full md:min-h-0">
      <header>
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
          Recepción
        </p>
        <h1 className="font-title text-3xl font-bold text-primary">
          Directorio de Clientes
        </h1>
        <p className="mt-1 font-body text-muted">
          Consulta datos de contacto y firmas de consentimiento
        </p>
      </header>

      <div className="md:min-h-0 md:flex-1">
        <ClientTable
          clients={clients}
          onOpenProfile={openProfile}
          onOpenSignature={openSignature}
        />
      </div>

      <ClientProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        cliente={activeClient}
        onUpdateContact={updateContact}
      />

      <SignatureModal
        isOpen={isSignatureOpen}
        onClose={() => setIsSignatureOpen(false)}
        clienteId={activeClient?.id}
      />
    </div>
  );
}
