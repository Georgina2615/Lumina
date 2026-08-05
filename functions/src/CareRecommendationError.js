// Representa errores controlados de recomendaciones
export class CareRecommendationError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = 'CareRecommendationError';
  }
}
