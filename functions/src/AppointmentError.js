// Representa un incumplimiento esperado de las citas
export class AppointmentError extends Error {
  // Conserva el código compatible con funciones
  constructor(code, message) {
    super(message);
    this.name = 'AppointmentError';
    this.code = code;
  }
}
