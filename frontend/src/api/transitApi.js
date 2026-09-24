const BASE_URL = 'http://localhost:8082/api';

export const transitApi = {
  // Récupérer les recommandations pour un étudiant
  getRecommendations: async (lat, lng, destination) => {
    const params = new URLSearchParams({
      latitude: lat,
      longitude: lng,
      destination,
    });
    const response = await fetch(`${BASE_URL}/recommendations?${params.toString()}`);
    if (!response.ok) throw new Error('Erreur lors de la récupération des recommandations');
    return response.json();
  },

  // Récupérer les analyses globales (Top 5 itinéraires)
  getTopRoutes: async () => {
    const response = await fetch(`${BASE_URL}/analytics/top-routes`);
    if (!response.ok) throw new Error('Erreur lors de la récupération des analyses');
    return response.json();
  },

  // Récupérer les suggestions d'optimisation
  getOptimizationSuggestions: async () => {
    const response = await fetch(`${BASE_URL}/optimization/suggestions`);
    if (!response.ok) throw new Error('Erreur lors de la récupération des optimisations');
    return response.json();
  }
};
