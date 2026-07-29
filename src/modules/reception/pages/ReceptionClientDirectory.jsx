import { useState } from 'react';
import { useClients } from '../hooks';
import { ClientTable, ClientProfileModal, SignatureModal } from '../components';

export default function ReceptionClientDirectory() {
  // Lógica principal
  const {
    clientes,
    cargando,
    errorLocal,
    actualizarContacto: updateContact
  } = useClients();

  // Estados para controlar los modales
  const [clienteActivo, setClienteActivo] = useState(null);
  const [modalPerfilAbierto, setModalPerfilAbierto] = useState(false);
  const [modalFirmaAbierto, setModalFirmaAbierto] = useState(false);

  // Manejadores de apertura
  const abrirPerfil = (cliente) => {
    setClienteActivo(cliente);
    setModalPerfilAbierto(true);
  };

  const abrirFirma = (cliente) => {
    setClienteActivo(cliente);
    setModalFirmaAbierto(true);
  };

  if (cargando) {
    return (
      <div className="h-full flex items-center justify-center text-muted font-body">
        Cargando directorio de clientes...
      </div>
    );
  }

  if (errorLocal) {
    return (
      <div className="h-full flex items-center justify-center text-error font-body">
        {errorLocal}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-6 relative">
      
      {/* Encabezado */}
      <div>
        <h1 className="text-3xl font-title font-bold text-primary">Directorio de Clientes</h1>
        <p className="text-muted font-body mt-1">
          Gestión de expedientes y firmas de consentimiento
        </p>
      </div>

      {/* Contenido principal de la tabla */}
      <div className="flex-1 min-h-[500px]">
        <ClientTable 
          clientes={clientes} 
          onOpenProfile={abrirPerfil}
          onOpenSignature={abrirFirma}
        />
      </div>

      {/* MODALES ORQUESTADOS AQUÍ */}
      <ClientProfileModal 
        isOpen={modalPerfilAbierto} 
        onClose={() => setModalPerfilAbierto(false)} 
        cliente={clienteActivo}
        onUpdateContact={updateContact}
      />

      <SignatureModal 
        isOpen={modalFirmaAbierto} 
        onClose={() => setModalFirmaAbierto(false)} 
        clienteId={clienteActivo?.id} 
      />

    </div>
  );
}
