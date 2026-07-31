// Representa un incumplimiento esperado del inventario
export class RetailInventoryError extends Error {
  // Conserva el código compatible con funciones
  constructor(code, message) {
    super(message);
    this.name = 'RetailInventoryError';
    this.code = code;
  }
}
