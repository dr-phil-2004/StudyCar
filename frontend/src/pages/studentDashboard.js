import React, { useState } from 'react';
import { transitApi } from '../api/transitApi';

export default function StudentDashboard() {
  const [destination, setDestination] = useState('UAC');
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  
  // Coordonnées fictives de l'étudiant à Calavi pour le test
  const studentLat = 6.4420;
  const studentLng = 2.3510;

  const handleSearch = async () => {
    setLoading(true);
    try {
      const data = await transitApi.getRecommendations(studentLat, studentLng, destination);
      setRecommendations(data);
    } catch (error) {
      console.error(error);
      alert("Impossible de charger les recommandations");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h2 style={{ borderBottom: '2px solid #0056b3', paddingBottom: '10px', color: '#0056b3' }}>
        🚀 Où allez-vous ? (Espace Étudiant)
      </h2>
      
      <div style={{ display: 'flex', gap: '10px', margin: '20px 0' }}>
        <select 
          value={destination} 
          onChange={(e) => setDestination(e.target.value)}
          style={{ flex: 1, padding: '10px', borderRadius: '5px', fontSize: '16px' }}
        >
          <option value="UAC">Université d'Abomey-Calavi (UAC)</option>
          <option value="ENEAM">ENEAM</option>
        </select>
        <button 
          onClick={handleSearch}
          style={{ padding: '10px 20px', backgroundColor: '#0056b3', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' }}
        >
          {loading ? 'Calcul...' : 'Trouver mon bus'}
        </button>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3>🚌 Bus recommandés pour vous :</h3>
        {recommendations.length === 0 && !loading && (
          <p style={{ color: '#666', fontStyle: 'italic' }}>Aucune recherche effectuée ou aucun bus disponible.</p>
        )}

        {recommendations.map((rec, index) => (
          <div 
            key={rec.tripId} 
            style={{
              border: index === 0 ? '2px solid #28a745' : '1px solid #ddd',
              borderRadius: '8px',
              padding: '15px',
              marginBottom: '15px',
              backgroundColor: index === 0 ? '#e8f5e9' : '#fff',
              position: 'relative'
            }}
          >
            {index === 0 && (
              <span style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: '#28a745', color: 'white', padding: '3px 8px', borderRadius: '3px', fontSize: '12px', fontWeight: 'bold' }}>
                MEILLEUR CHOIX
              </span>
            )}
            <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>Bus : {rec.busCode}</h4>
            <p style={{ margin: '5px 0' }}>📍 Arrêt conseillé : <strong>{rec.recommendedStopName}</strong></p>
            <p style={{ margin: '5px 0' }}>⏳ Arrivée du bus dans : <strong>{rec.etaMinutes} min</strong></p>
            <p style={{ margin: '5px 0' }}>💺 Places disponibles : <strong>{rec.availableSeats}</strong></p>
            <p style={{ margin: '5px 0' }}>⏱️ Temps de trajet total : {rec.totalTravelTime} min</p>
            <div style={{ marginTop: '10px', fontSize: '14px', fontWeight: 'bold', color: '#0056b3' }}>
              Score d'adéquation : {rec.score}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
