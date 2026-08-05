import { createHash } from 'node:crypto';

// Define el consentimiento facial vigente
export const clinicalConsentTemplate = Object.freeze({
  id: 'general-facial-v1',
  version: 1,
  title: 'Consentimiento informado para procedimiento estético facial',
  responsible: {
    name: 'Lumina Skin',
    email: 'luminask01@gmail.com',
    phone: '981 101 7687',
    address: 'Avenida Adolfo López Mateos 426 Campeche Campeche'
  },
  statements: [
    { id: 'adult', text: 'Declaro que tengo dieciocho años o más' },
    { id: 'truthful_data', text: 'Declaro que la información sobre mi salud alergias medicamentos embarazo y antecedentes es verdadera' },
    { id: 'aesthetic_scope', text: 'Comprendo que el procedimiento es estético y no sustituye un diagnóstico ni un tratamiento médico' },
    { id: 'treatment_explained', text: 'Recibí una explicación clara del tratamiento que se realizará' },
    { id: 'variable_results', text: 'Comprendo que los resultados pueden variar y no están garantizados' },
    { id: 'temporary_reactions', text: 'Comprendo que pueden presentarse sensibilidad enrojecimiento irritación resequedad o inflamación temporal' },
    { id: 'questions_answered', text: 'Tuve oportunidad de hacer preguntas y recibí respuestas comprensibles' },
    { id: 'aftercare', text: 'Me comprometo a seguir los cuidados indicados y avisar si presento una reacción inusual' },
    { id: 'voluntary_treatment', text: 'Autorizo voluntariamente el tratamiento estético indicado para esta cita' },
    { id: 'private_record', text: 'Autorizo el resguardo privado de mis datos clínicos y firma para mi atención y seguimiento' }
  ],
  schemaVersion: 1
});

// Calcula la huella de la versión aprobada
export const clinicalConsentTemplateHash = createHash('sha256')
  .update(JSON.stringify(clinicalConsentTemplate))
  .digest('hex');

// Construye el documento real de la plantilla
export const buildClinicalConsentTemplateDocument = (timestamp) => ({
  ...clinicalConsentTemplate,
  contentHash: clinicalConsentTemplateHash,
  createdAt: timestamp,
  active: true
});
