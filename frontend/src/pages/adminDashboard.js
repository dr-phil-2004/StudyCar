import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8082';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return undefined;
    }
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (!payload.roles?.includes('ROLE_ADMIN')) {
        navigate('/dashboard');
        return undefined;
      }
    } catch {
      navigate('/login');
      return undefined;
    }

    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      axios.get(`${API_URL}/api/optimization/suggestions`, { headers }),
      axios.get(`${API_URL}/api/analytics/top-routes`, { headers }),
    ])
      .then(([suggestionsResponse, routesResponse]) => {
        if (!active) return;
        setSuggestions(suggestionsResponse.data || []);
        setRoutes(routesResponse.data || []);
      })
      .catch(() => {
        if (active) setError('Impossible de charger les indicateurs administrateur.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [navigate]);

  if (loading) {
    return <div className="dashboard-loading"><div className="dashboard-spinner" /><p>Chargement du pilotage...</p></div>;
  }

  return (
    <main className="admin-dashboard">
      <header className="admin-dashboard-header">
        <div>
          <span className="admin-eyebrow">Espace administrateur</span>
          <h1>Pilotage du réseau</h1>
          <p>Détection des zones fréquentées, heures de pointe et congestions à partir des événements enregistrés.</p>
        </div>
        <button type="button" className="admin-refresh" onClick={() => window.location.reload()}>
          Actualiser
        </button>
      </header>

      {error && <div className="admin-error">{error}</div>}

      <section className="admin-section">
        <div className="admin-section-heading">
          <h2>Itinéraires les plus fréquentés</h2>
          <span>{routes.length} lignes analysées</span>
        </div>
        <div className="admin-route-grid">
          {routes.slice(0, 5).map((route) => (
            <article className="admin-route-card" key={route.routeId}>
              <h3>{route.routeName || route.routeCode}</h3>
              <strong>{Number(route.totalPassengersTransported || 0).toLocaleString('fr-FR')}</strong>
              <span>étudiants transportés</span>
              <div className="admin-progress"><i style={{ width: `${Math.min(100, route.averageSaturationRate || 0)}%` }} /></div>
              <small>Saturation moyenne : {Number(route.averageSaturationRate || 0).toFixed(1)}%</small>
            </article>
          ))}
        </div>
      </section>

      <section className="admin-section">
        <div className="admin-section-heading">
          <h2>Actions correctives mesurées</h2>
          <span>{suggestions.length} recommandations</span>
        </div>
        {suggestions.length === 0 ? (
          <p className="admin-empty">Aucune action déclenchée par les seuils actuels.</p>
        ) : (
          <div className="admin-suggestion-list">
            {suggestions.map((suggestion, index) => (
              <article className="admin-suggestion" key={`${suggestion.routeCode}-${suggestion.actionType}-${index}`}>
                <div className="admin-suggestion-title">
                  <span className={`admin-action admin-action-${suggestion.actionType}`}>{suggestion.actionType}</span>
                  <h3>{suggestion.routeName || suggestion.routeCode}</h3>
                  <strong>Priorité {Number(suggestion.priorityScore || 0).toFixed(1)}</strong>
                </div>
                <p>{suggestion.justification}</p>
                <div className="admin-indicator">
                  <span>Indicateur : <strong>{suggestion.indicator || 'Donnée calculée'}</strong></span>
                  <span>{Number(suggestion.indicatorValue || 0).toFixed(1)} {suggestion.indicatorUnit || ''}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
