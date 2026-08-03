// Representa un incumplimiento esperado del inventario de cabina
export class CabinInventoryError extends Error {
  // Conserva el código compatible con funciones
  constructor(code, message) {
    super(message);
    this.name = 'CabinInventoryError';
    this.code = code;
  }
}
