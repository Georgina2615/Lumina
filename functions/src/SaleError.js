// Representa un incumplimiento esperado del dominio
export class SaleError extends Error {
  // Conserva el código compatible con funciones
  constructor(code, message) {
    super(message);
    this.name = 'SaleError';
    this.code = code;
  }
}
