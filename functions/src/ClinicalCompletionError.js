// Representa errores controlados del cierre clínico
export class ClinicalCompletionError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = 'ClinicalCompletionError';
  }
}
