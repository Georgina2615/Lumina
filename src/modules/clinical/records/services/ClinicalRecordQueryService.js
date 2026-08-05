import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../config/firebase';
import { createClinicalRecordForm } from './ClinicalRecordPolicy';

// Carga la clienta y su única ficha técnica
export const loadClinicalRecord = async (clientId) => {
  const [clientSnapshot, recordSnapshot] = await Promise.all([
    getDoc(doc(db, 'clientes', clientId)),
    getDoc(doc(db, 'expedientesClinicos', clientId))
  ]);

  if (!clientSnapshot.exists()) {
    throw new Error('La clienta ya no está disponible');
  }

  const clientData = clientSnapshot.data();
  const recordData = recordSnapshot.exists() ? recordSnapshot.data() : null;
  const validRecord = recordData?.schemaVersion === 1
    && recordData.clientId === clientId
    && Number.isSafeInteger(recordData.revision)
    ? recordData
    : null;

  return {
    client: {
      consentSigned: clientData.consentimientoFirmado === true,
      email: typeof clientData.email === 'string' ? clientData.email : '',
      id: clientId,
      name: typeof clientData.nombreCompleto === 'string'
        ? clientData.nombreCompleto
        : 'Clienta sin nombre',
      phone: typeof clientData.telefono === 'string' ? clientData.telefono : ''
    },
    record: createClinicalRecordForm(validRecord),
    revision: validRecord?.revision ?? 0,
    status: validRecord?.status === 'completed' ? 'completed' : 'draft'
  };
};
