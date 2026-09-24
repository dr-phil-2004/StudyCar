/* global L */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8082';

const DISTANCE_THRESHOLDS = {
  close: 1.0,
  medium: 3.0,
};

function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getDistanceColor(distanceKm) {
  if (distanceKm <= DISTANCE_THRESHOLDS.close) return '#16a34a';
  if (distanceKm <= DISTANCE_THRESHOLDS.medium) return '#f97316';
  return '#ef4444';
}

function getDistanceLabel(distanceKm) {
  if (distanceKm <= DISTANCE_THRESHOLDS.close) return 'Near';
  if (distanceKm <= DISTANCE_THRESHOLDS.medium) return 'Medium';
  return 'Far';
}

function createBusIcon(color, busCode) {
  return L.divIcon({
    className: 'custom-bus-marker',
    html: `<div class="bus-marker-wrapper" style="--bus-color:${color}">
      <div class="bus-marker-pin">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="5" width="18" height="12" rx="2" fill="${color}" stroke="white" stroke-width="1.5"/>
          <rect x="6" y="8" width="4" height="4" rx="0.5" fill="white" opacity="0.9"/>
          <rect x="11" y="8" width="4" height="4" rx="0.5" fill="white" opacity="0.9"/>
          <rect x="16" y="8" width="3" height="4" rx="0.5" fill="white" opacity="0.9"/>
          <circle cx="7" cy="19" r="2" fill="${color}" stroke="white" stroke-width="1"/>
          <circle cx="17" cy="19" r="2" fill="${color}" stroke="white" stroke-width="1"/>
        </svg>
        <span class="bus-marker-label">${busCode}</span>
      </div>
    </div>`,
    iconSize: [28, 42],
    iconAnchor: [14, 38],
  });
}

const DEFAULT_STOPS = [
  { id: 'akpakpa', name: 'Akpakpa', latitude: 6.3708, longitude: 2.4567, waiting: 15, boarded: 8, alighted: 3, averageWait: 12 },
  { id: 'ganhi', name: 'Ganhi', latitude: 6.3678, longitude: 2.4184, waiting: 9, boarded: 5, alighted: 2, averageWait: 9 },
  { id: 'etoile-rouge', name: 'Étoile Rouge', latitude: 6.3702, longitude: 2.3957, waiting: 12, boarded: 7, alighted: 4, averageWait: 15 },
  { id: 'uac', name: 'UAC', latitude: 6.4135, longitude: 2.3417, waiting: 6, boarded: 4, alighted: 6, averageWait: 7 },
];

function createStopIcon() {
  return L.divIcon({
    className: 'custom-stop-marker',
    html: `<div class="stop-marker-pin" aria-label="Arrêt de bus">
      <svg width="30" height="34" viewBox="0 0 30 34" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M15 1C7.82 1 2 6.82 2 14c0 9.2 13 18 13 18s13-8.8 13-18C28 6.82 22.18 1 15 1Z" fill="#0f766e" stroke="white" stroke-width="2"/>
        <rect x="9" y="9" width="12" height="10" rx="2" fill="white"/>
        <rect x="11" y="11" width="3" height="3" fill="#0f766e"/><rect x="16" y="11" width="3" height="3" fill="#0f766e"/>
        <circle cx="12" cy="21" r="1.5" fill="white"/><circle cx="18" cy="21" r="1.5" fill="white"/>
      </svg>
    </div>`,
    iconSize: [30, 34],
    iconAnchor: [15, 32],
  });
}

function createUserIcon() {
  return L.divIcon({
    className: 'custom-user-marker',
    html: `<div class="user-marker-wrapper">
      <div class="user-marker-pulse"></div>
      <div class="user-marker-dot">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="9" r="4" fill="white"/>
          <path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z" fill="white" opacity="0.3"/>
        </svg>
      </div>
    </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

function Dashboard() {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const userMarkerRef = useRef(null);
  const accuracyCircleRef = useRef(null);
  const busMarkersRef = useRef({});
  const stopMarkersRef = useRef({});
  const wsRef = useRef(null);

  const [buses, setBuses] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('idle');
  const [locationError, setLocationError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBus, setSelectedBus] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);

  const stops = (buses.flatMap((bus) => bus.route?.stops || []).length > 0
    ? buses.flatMap((bus) => bus.route?.stops || [])
    : DEFAULT_STOPS
  ).reduce((uniqueStops, stop) => {
    const stopId = stop.id || stop.name;
    if (!uniqueStops.some((item) => (item.id || item.name) === stopId)) uniqueStops.push(stop);
    return uniqueStops;
  }, []);

  const stopMetrics = (stop) => {
    const waiting = Number(stop.waiting ?? stop.waitingPassengers ?? stop.passengersWaiting ?? 0);
    const boarded = Number(stop.boarded ?? stop.boarding ?? stop.passengersBoarded ?? 0);
    const alighted = Number(stop.alighted ?? stop.alighting ?? stop.passengersAlighted ?? 0);
    return {
      waiting,
      boarded,
      alighted,
      remaining: Math.max(0, waiting - boarded),
      averageWait: Number(stop.averageWait ?? stop.averageWaitingTime ?? 0),
    };
  };

  const token = localStorage.getItem('token');

  const fetchBuses = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/buses`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setBuses(response.data || []);
    } catch (err) {
      setError('Unable to load bus data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const requestLocation = useCallback(() => {
    setLocationStatus('requesting');
    setLocationError('');

    if (!navigator.geolocation) {
      setLocationStatus('denied');
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude, accuracy });
        setLocationStatus('granted');

        if (mapInstanceRef.current) {
          const map = mapInstanceRef.current;
          map.setView([latitude, longitude], 14);

          if (userMarkerRef.current) {
            userMarkerRef.current.setLatLng([latitude, longitude]);
          } else {
            userMarkerRef.current = L.marker([latitude, longitude], { icon: createUserIcon() })
              .addTo(map)
              .bindPopup('<strong>Your location</strong>');
          }

          if (accuracyCircleRef.current) {
            accuracyCircleRef.current.setLatLng([latitude, longitude]).setRadius(accuracy);
          } else {
            accuracyCircleRef.current = L.circle([latitude, longitude], {
              radius: accuracy,
              color: '#246bff',
              fillColor: '#246bff',
              fillOpacity: 0.08,
              weight: 1,
            }).addTo(map);
          }
        }
      },
      (err) => {
        setLocationStatus('denied');
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError('Location permission denied. Please allow location access to see nearby buses.');
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setLocationError('Location information is unavailable.');
        } else if (err.code === err.TIMEOUT) {
          setLocationError('Location request timed out. Please try again.');
        } else {
          setLocationError('Unable to retrieve your location.');
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
    );
  }, []);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    fetchBuses();

    if (window.L) {
      initMap();
    } else {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => initMap();
      document.body.appendChild(script);
    }

    function initMap() {
      if (mapInstanceRef.current || !mapRef.current) return;

      const defaultCenter = [6.4025, 2.3387];
      const map = L.map(mapRef.current, {
        zoomControl: true,
        attributionControl: true,
      }).setView(defaultCenter, 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;

      if (userLocation) {
        map.setView([userLocation.lat, userLocation.lng], 14);
      }

      requestLocation();
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [token, navigate, fetchBuses, requestLocation, userLocation]);

  useEffect(() => {
    if (!mapInstanceRef.current || !window.L) return;

    stops.forEach((stop) => {
      if (!stop.latitude || !stop.longitude) return;
      const metrics = stopMetrics(stop);
      const popupContent = `<div class="stop-popup">
        <h4>Arrêt ${stop.name}</h4>
        <div class="stop-popup-grid">
          <span>En attente</span><strong>${metrics.waiting}</strong>
          <span>Montées</span><strong>${metrics.boarded}</strong>
          <span>Descendues</span><strong>${metrics.alighted}</strong>
          <span>Restent à quai</span><strong>${metrics.remaining}</strong>
          <span>Attente moyenne</span><strong>${metrics.averageWait} min</strong>
        </div>
      </div>`;
      const markerId = stop.id || stop.name;
      if (stopMarkersRef.current[markerId]) {
        stopMarkersRef.current[markerId].setLatLng([stop.latitude, stop.longitude]).setPopupContent(popupContent);
      } else {
        stopMarkersRef.current[markerId] = L.marker([stop.latitude, stop.longitude], { icon: createStopIcon(), keyboard: true })
          .addTo(mapInstanceRef.current)
          .bindPopup(popupContent);
      }
    });

    Object.keys(stopMarkersRef.current).forEach((markerId) => {
      if (!stops.some((stop) => (stop.id || stop.name) === markerId)) {
        mapInstanceRef.current.removeLayer(stopMarkersRef.current[markerId]);
        delete stopMarkersRef.current[markerId];
      }
    });
  }, [stops]);

  useEffect(() => {
    if (!buses.length || !mapInstanceRef.current || !window.L) return;

    buses.forEach((bus) => {
      if (!bus.latitude || !bus.longitude) return;

      const dist = userLocation
        ? getDistanceKm(userLocation.lat, userLocation.lng, bus.latitude, bus.longitude)
        : null;
      const color = dist !== null ? getDistanceColor(dist) : '#246bff';
      const icon = createBusIcon(color, bus.code || `Bus ${bus.id}`);

      const popupContent = `
        <div class="bus-popup">
          <h4>${bus.code || 'Bus'}</h4>
          <p class="bus-popup-reg">${bus.registrationNumber || ''}</p>
          ${dist !== null ? `<p class="bus-popup-dist"><span style="color:${color}">●</span> ${getDistanceLabel(dist)} — ${dist.toFixed(2)} km away</p>` : ''}
          <p class="bus-popup-cap">Capacity: ${bus.capacity || 'N/A'} seats</p>
          ${bus.route ? `<p class="bus-popup-route">Route: ${bus.route.name || bus.route.code || ''}</p>` : ''}
          <button class="bus-popup-btn" onclick="window.location.hash='#book-${bus.id}'">Book this bus</button>
        </div>
      `;

      if (busMarkersRef.current[bus.id]) {
        const marker = busMarkersRef.current[bus.id];
        marker.setLatLng([bus.latitude, bus.longitude]);
        marker.setIcon(icon);
        marker.setPopupContent(popupContent);
      } else {
        const marker = L.marker([bus.latitude, bus.longitude], { icon })
          .addTo(mapInstanceRef.current)
          .bindPopup(popupContent);
        busMarkersRef.current[bus.id] = marker;
      }
    });

    const currentBusIds = new Set(buses.map((b) => b.id));
    Object.keys(busMarkersRef.current).forEach((id) => {
      if (!currentBusIds.has(Number(id))) {
        mapInstanceRef.current.removeLayer(busMarkersRef.current[id]);
        delete busMarkersRef.current[id];
      }
    });
  }, [buses, userLocation]);

  useEffect(() => {
    if (!window.SockJS || !window.Stomp) {
      const sockjsScript = document.createElement('script');
      sockjsScript.src = 'https://unpkg.com/sockjs-client@1.6.1/dist/sockjs.min.js';
      sockjsScript.async = true;
      document.body.appendChild(sockjsScript);

      const stompScript = document.createElement('script');
      stompScript.src = 'https://unpkg.com/stompjs@2.3.3/lib/stomp.min.js';
      stompScript.async = true;
      stompScript.onload = () => connectWs();
      document.body.appendChild(stompScript);
    } else {
      connectWs();
    }

    function connectWs() {
      if (!window.SockJS || !window.Stomp) return;
      try {
        const socket = new window.SockJS(`${API_URL}/ws-transit`);
        const stompClient = window.Stomp.over(socket);
        wsRef.current = stompClient;

        stompClient.connect(
          {},
          () => {
            setWsConnected(true);
            stompClient.subscribe('/topic/buses', (message) => {
              try {
                const update = JSON.parse(message.body);
                setBuses((prev) =>
                  prev.map((b) =>
                    b.id === update.busId
                      ? { ...b, latitude: update.latitude, longitude: update.longitude }
                      : b
                  )
                );
              } catch {
                /* ignore parse errors */
              }
            });
          },
          () => {
            setWsConnected(false);
          }
        );
      } catch {
        setWsConnected(false);
      }
    }

    return () => {
      if (wsRef.current && wsRef.current.connected) {
        wsRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchBuses();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchBuses]);

  const sortedBuses = userLocation
    ? [...buses]
        .filter((b) => b.latitude && b.longitude)
        .map((b) => ({
          ...b,
          distance: getDistanceKm(userLocation.lat, userLocation.lng, b.latitude, b.longitude),
        }))
        .sort((a, b) => a.distance - b.distance)
    : buses.filter((b) => b.latitude && b.longitude);

  const handleBusClick = (bus) => {
    if (bus.latitude && bus.longitude && mapInstanceRef.current) {
      mapInstanceRef.current.setView([bus.latitude, bus.longitude], 16);
      const marker = busMarkersRef.current[bus.id];
      if (marker) marker.openPopup();
      setSelectedBus(bus);
    }
  };

  const handleBookBus = (bus) => {
    navigate('/booking', { state: { busId: bus.id, busCode: bus.code } });
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="dashboard-spinner" />
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-layout">
        <div className="dashboard-sidebar">
          <div className="sidebar-header">
            <h3>Live Bus Tracking</h3>
            <p className="sidebar-subtitle">Real-time bus locations near you</p>
          </div>

          {locationStatus === 'idle' || locationStatus === 'requesting' ? (
            <div className="location-prompt">
              <div className="location-prompt-icon">📍</div>
              <p>Enable location to see buses near you with distance color coding.</p>
              <button
                className="location-btn"
                onClick={requestLocation}
                disabled={locationStatus === 'requesting'}
              >
                {locationStatus === 'requesting' ? 'Requesting...' : 'Enable Location'}
              </button>
            </div>
          ) : locationStatus === 'denied' ? (
            <div className="location-error">
              <div className="location-error-icon">⚠️</div>
              <p>{locationError}</p>
              <button className="location-btn" onClick={requestLocation}>
                Try Again
              </button>
            </div>
          ) : (
            <div className="location-info">
              <div className="location-info-badge">
                <span className="location-pulse" />
                Location active
              </div>
            </div>
          )}

          <div className="legend">
            <h4 className="legend-title">Distance Colors</h4>
            <div className="legend-item">
              <span className="legend-dot" style={{ background: '#16a34a' }} />
              <span>Near (&lt; {DISTANCE_THRESHOLDS.close} km)</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot" style={{ background: '#f97316' }} />
              <span>Medium ({DISTANCE_THRESHOLDS.close}–{DISTANCE_THRESHOLDS.medium} km)</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot" style={{ background: '#ef4444' }} />
              <span>Far (&gt; {DISTANCE_THRESHOLDS.medium} km)</span>
            </div>
          </div>

          <div className="stop-list-sidebar">
            <h4 className="bus-list-title">Arrêts ({stops.length})</h4>
            <div className="stop-list-scroll">
              {stops.map((stop) => {
                const metrics = stopMetrics(stop);
                return (
                  <article className="stop-list-card" key={stop.id || stop.name}>
                    <div className="stop-list-icon" aria-hidden="true">▣</div>
                    <div className="stop-list-info">
                      <strong>{stop.name}</strong>
                      <span>{metrics.waiting} en attente · {metrics.remaining} à quai</span>
                      <small>↑ {metrics.boarded} montées · ↓ {metrics.alighted} descendues · {metrics.averageWait} min moyen</small>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="bus-list-sidebar">
            <h4 className="bus-list-title">
              Buses ({sortedBuses.length})
              {wsConnected && <span className="ws-status ws-online">Live</span>}
              {!wsConnected && <span className="ws-status ws-offline">Polling</span>}
            </h4>
            {error && <div className="dashboard-error">{error}</div>}
            {sortedBuses.length === 0 ? (
              <p className="bus-list-empty">No buses with location data available.</p>
            ) : (
              <div className="bus-list-scroll">
                {sortedBuses.map((bus) => {
                  const dist = bus.distance;
                  const color = dist !== undefined ? getDistanceColor(dist) : '#246bff';
                  return (
                    <div
                      key={bus.id}
                      className={`bus-list-card ${selectedBus?.id === bus.id ? 'bus-list-card-active' : ''}`}
                      onClick={() => handleBusClick(bus)}
                    >
                      <div className="bus-list-card-icon" style={{ background: color }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <rect x="3" y="5" width="18" height="12" rx="2" fill="white"/>
                          <rect x="6" y="8" width="4" height="4" rx="0.5" fill={color}/>
                          <rect x="11" y="8" width="4" height="4" rx="0.5" fill={color}/>
                          <circle cx="7" cy="19" r="2" fill="white"/>
                          <circle cx="17" cy="19" r="2" fill="white"/>
                        </svg>
                      </div>
                      <div className="bus-list-card-info">
                        <span className="bus-list-card-code">{bus.code}</span>
                        {dist !== undefined && (
                          <span className="bus-list-card-dist" style={{ color }}>
                            {dist.toFixed(2)} km — {getDistanceLabel(dist)}
                          </span>
                        )}
                        {bus.route && (
                          <span className="bus-list-card-route">{bus.route.name}</span>
                        )}
                      </div>
                      <button
                        className="bus-list-card-book"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBookBus(bus);
                        }}
                      >
                        Book
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="dashboard-map-container">
          <div ref={mapRef} className="dashboard-map" />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
