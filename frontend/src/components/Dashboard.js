import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8082';

let stompLibrariesPromise;

function loadScript(src, globalName) {
  if (window[globalName]) return Promise.resolve();

  const existingScript = document.querySelector(`script[src="${src}"]`);
  if (existingScript) {
    return new Promise((resolve, reject) => {
      existingScript.addEventListener('load', resolve, { once: true });
      existingScript.addEventListener('error', reject, { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

function loadStompLibraries() {
  if (!stompLibrariesPromise) {
    stompLibrariesPromise = Promise.all([
      loadScript(
        'https://unpkg.com/sockjs-client@1.6.1/dist/sockjs.min.js',
        'SockJS'
      ),
      loadScript(
        'https://unpkg.com/stompjs@2.3.3/lib/stomp.min.js',
        'Stomp'
      ),
    ]);
  }

  return stompLibrariesPromise;
}

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

function getBusStats(bus) {
  const capacity = Number(bus.capacity);
  const passengers = Number(
    bus.currentPassengers ??
      bus.passengerCount ??
      bus.passengersTransported ??
      bus.passengersCount ??
      0
  );
  const safeCapacity = Number.isFinite(capacity) && capacity > 0 ? capacity : 0;
  const safePassengers = Number.isFinite(passengers) && passengers >= 0 ? passengers : 0;

  return {
    capacity: safeCapacity,
    passengers: safePassengers,
    availableSeats: Math.max(safeCapacity - safePassengers, 0),
    occupancyRate: safeCapacity
      ? Math.min((safePassengers / safeCapacity) * 100, 100)
      : 0,
  };
}

function createBusIcon(color, busCode) {
  return window.L.divIcon({
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

function createUserIcon() {
  return window.L.divIcon({
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

function createBusStopIcon(stopName) {
  return window.L.divIcon({
    className: 'custom-bus-stop-marker',
    html: `<div class="bus-stop-marker-wrapper">
      <div class="bus-stop-marker-pin">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="#8B5CF6" stroke="white" stroke-width="2"/>
          <rect x="8" y="6" width="8" height="12" rx="1" fill="white"/>
          <rect x="9" y="8" width="6" height="3" rx="0.5" fill="#8B5CF6"/>
          <rect x="9" y="12" width="6" height="3" rx="0.5" fill="#8B5CF6"/>
        </svg>
        <span class="bus-stop-marker-label">${stopName}</span>
      </div>
    </div>`,
    iconSize: [24, 36],
    iconAnchor: [12, 30],
  });
}

function Dashboard() {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const userMarkerRef = useRef(null);
  const accuracyCircleRef = useRef(null);
  const busMarkersRef = useRef({});
  const wsRef = useRef(null);

  const [buses, setBuses] = useState([]);
  const [tripStats, setTripStats] = useState({});
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('idle');
  const [locationError, setLocationError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBus, setSelectedBus] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [topRoutes, setTopRoutes] = useState([]);
  const [routesPanelOpen, setRoutesPanelOpen] = useState(false);
  const [routesLoading, setRoutesLoading] = useState(false);
  const [routesError, setRoutesError] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [recommendationsOpen, setRecommendationsOpen] = useState(false);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [recommendationsError, setRecommendationsError] = useState('');
  const [recommendationDestination, setRecommendationDestination] = useState('UAC');
  const [stops, setStops] = useState([]);
  const [stopAnalytics, setStopAnalytics] = useState({});
  const [selectedStop, setSelectedStop] = useState(null);
  const stopMarkersRef = useRef({});

  const token = localStorage.getItem('token');

  const fetchBuses = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/buses`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setBuses(response.data || []);
    } catch (err) {
      setError('Unable to load bus data. Please try again later.');
    }

    try {
      const tripsResponse = await axios.get(`${API_URL}/api/trips`, {
        headers: token ? { Authorization: 'Bearer ' + token } : {},
      });
      const nextTripStats = {};
      (tripsResponse.data || []).forEach((trip) => {
        const busId = trip.bus?.id;
        if (busId == null || (nextTripStats[busId] && trip.status !== 'IN_PROGRESS')) return;
        nextTripStats[busId] = { currentPassengers: trip.currentPassengers ?? 0 };
      });
      setTripStats(nextTripStats);
    } catch {
      setTripStats({});
    }

    setLoading(false);
  }, [token]);

  const fetchStops = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/stops`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setStops(response.data || []);
      
      // Fetch analytics for each stop
      const analyticsData = {};
      for (const stop of response.data || []) {
        try {
          const analyticsResponse = await axios.get(`${API_URL}/api/analytics/stops/${stop.id}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          analyticsData[stop.id] = analyticsResponse.data;
        } catch {
          analyticsData[stop.id] = null;
        }
      }
      setStopAnalytics(analyticsData);
    } catch (err) {
      console.error('Unable to load stop data:', err);
    }
  }, [token]);

  useEffect(() => {
    const handleViewBus = (event) => {
      const bus = buses.find((item) => item.id === event.detail);
      if (bus) setSelectedBus(bus);
    };

    window.addEventListener('studycar:view-bus', handleViewBus);
    return () => window.removeEventListener('studycar:view-bus', handleViewBus);
  }, [buses]);

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
            userMarkerRef.current = window.L.marker([latitude, longitude], { icon: createUserIcon() })
              .addTo(map)
              .bindPopup('<strong>Your location</strong>');
          }

          if (accuracyCircleRef.current) {
            accuracyCircleRef.current.setLatLng([latitude, longitude]).setRadius(accuracy);
          } else {
            accuracyCircleRef.current = window.L.circle([latitude, longitude], {
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

    let cancelled = false;
    fetchBuses();
    fetchStops();

    if (loading) {
      return () => {
        cancelled = true;
      };
    }

    if (window.L) {
      initMap();
    } else {
      if (!document.querySelector('link[data-leaflet-css]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.dataset.leafletCss = 'true';
        document.head.appendChild(link);
      }

      const existingScript = document.querySelector('script[data-leaflet-script]');
      if (existingScript) {
        existingScript.addEventListener('load', initMap, { once: true });
      } else {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.async = true;
        script.dataset.leafletScript = 'true';
        script.onload = initMap;
        document.body.appendChild(script);
      }
    }

    function initMap() {
      if (cancelled || mapInstanceRef.current || !mapRef.current || !window.L) return;

      const defaultCenter = [6.4025, 2.3387];
      const map = window.L.map(mapRef.current, {
        zoomControl: true,
        attributionControl: true,
        zoomAnimation: false,
      });
      map.setView(defaultCenter, 13, { animate: false });

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
      setMapReady(true);
      window.setTimeout(() => {
        if (!cancelled && mapInstanceRef.current === map) {
          map.invalidateSize({ animate: false });
        }
      }, 0);

      requestLocation();
    }

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        Object.values(busMarkersRef.current).forEach((marker) => marker.remove());
        Object.values(stopMarkersRef.current).forEach((marker) => marker.remove());
        busMarkersRef.current = {};
        stopMarkersRef.current = {};
        userMarkerRef.current = null;
        accuracyCircleRef.current = null;
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      setMapReady(false);
    };
  }, [token, navigate, fetchBuses, fetchStops, requestLocation, loading]);

  useEffect(() => {
    if (!mapReady || !buses.length || !mapInstanceRef.current || !window.L) return;

    buses.forEach((bus) => {
      if (!bus.latitude || !bus.longitude) return;

      const dist = userLocation
        ? getDistanceKm(userLocation.lat, userLocation.lng, bus.latitude, bus.longitude)
        : null;
      const color = dist !== null ? getDistanceColor(dist) : '#246bff';
      const icon = createBusIcon(color, bus.code || 'Bus ' + bus.id);
      const stats = getBusStats({ ...bus, ...tripStats[bus.id] });

      const distanceMarkup = dist !== null
        ? '<p class="bus-popup-dist"><span style="color:' + color + '">●</span> '
          + getDistanceLabel(dist) + ' — ' + dist.toFixed(2) + ' km away</p>'
        : '';
      const routeMarkup = bus.route
        ? '<p class="bus-popup-route">Route: '
          + (bus.route.name || bus.route.code || '') + '</p>'
        : '';
      const popupContent =
        '<div class="bus-popup">'
        + '<h4>' + (bus.code || 'Bus') + '</h4>'
        + '<p class="bus-popup-reg">' + (bus.registrationNumber || '') + '</p>'
        + distanceMarkup
        + '<p class="bus-popup-cap">Capacity: ' + (stats.capacity || 'N/A') + ' seats</p>'
        + routeMarkup
        + '<button class="bus-popup-btn" data-bus-id="' + bus.id + '" '
        + 'onclick="window.dispatchEvent(new CustomEvent(\'studycar:view-bus\', '
        + '{ detail: Number(this.dataset.busId) }))">Voir ce bus</button>'
        + '</div>';

      if (busMarkersRef.current[bus.id]) {
        const marker = busMarkersRef.current[bus.id];
        marker.setLatLng([bus.latitude, bus.longitude]);
        marker.setIcon(icon);
        marker.setPopupContent(popupContent);
      } else {
        const marker = window.L.marker([bus.latitude, bus.longitude], { icon })
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
  }, [buses, tripStats, userLocation, mapReady]);

  useEffect(() => {
    if (!mapReady || !stops.length || !mapInstanceRef.current || !window.L) return;

    stops.forEach((stop) => {
      if (!stop.latitude || !stop.longitude) return;

      const icon = createBusStopIcon(stop.name || 'Arrêt');
      const analytics = stopAnalytics[stop.id];
      
      const analyticsMarkup = analytics
        ? '<div class="stop-analytics">'
          + '<p><strong>👥 Personnes montées:</strong> ' + analytics.totalBoardings + '</p>'
          + '<p><strong>🚶 Personnes descendues:</strong> ' + analytics.totalAlightings + '</p>'
          + '<p><strong>⏳ Personnes en attente:</strong> ' + analytics.currentWaiting + '</p>'
          + '<p><strong>⏱️ Temps moyen d\'attente:</strong> ' + analytics.averageWaitingTimeMinutes + ' min</p>'
          + '</div>'
        : '<p>Données non disponibles</p>';

      const popupContent =
        '<div class="stop-popup">'
        + '<h4>' + (stop.name || 'Arrêt') + '</h4>'
        + analyticsMarkup
        + '</div>';

      if (stopMarkersRef.current[stop.id]) {
        const marker = stopMarkersRef.current[stop.id];
        marker.setLatLng([stop.latitude, stop.longitude]);
        marker.setIcon(icon);
        marker.setPopupContent(popupContent);
      } else {
        const marker = window.L.marker([stop.latitude, stop.longitude], { icon })
          .addTo(mapInstanceRef.current)
          .bindPopup(popupContent)
          .on('click', () => setSelectedStop(stop));
        stopMarkersRef.current[stop.id] = marker;
      }
    });

    const currentStopIds = new Set(stops.map((s) => s.id));
    Object.keys(stopMarkersRef.current).forEach((id) => {
      if (!currentStopIds.has(Number(id))) {
        mapInstanceRef.current.removeLayer(stopMarkersRef.current[id]);
        delete stopMarkersRef.current[id];
      }
    });
  }, [stops, stopAnalytics, mapReady]);

  useEffect(() => {
    let active = true;
    let socket;
    let stompClient;

    const disconnectWs = () => {
      active = false;
      setWsConnected(false);

      if (stompClient) {
        stompClient.disconnect();
      }
      if (socket) {
        socket.close();
      }
      if (wsRef.current === stompClient) {
        wsRef.current = null;
      }
    };

    loadStompLibraries()
      .then(() => {
        if (!active) return;

        socket = new window.SockJS(`${API_URL}/ws-transit`);
        stompClient = window.Stomp.over(socket);
        wsRef.current = stompClient;

        stompClient.connect(
          {},
          () => {
            if (!active) {
              disconnectWs();
              return;
            }

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
            if (active) setWsConnected(false);
          }
        );
      })
      .catch(() => {
        if (active) setWsConnected(false);
      });

    return disconnectWs;
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchBuses();
      fetchStops();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchBuses, fetchStops]);

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

  const handleTopRoutesToggle = async () => {
    const nextOpen = !routesPanelOpen;
    setRoutesPanelOpen(nextOpen);
    if (!nextOpen || topRoutes.length > 0 || routesLoading) return;

    setRoutesLoading(true);
    setRoutesError('');
    try {
      const response = await axios.get(`${API_URL}/api/analytics/top-routes`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setTopRoutes(response.data || []);
    } catch {
      setRoutesError('Impossible de charger les itinéraires.');
    } finally {
      setRoutesLoading(false);
    }
  };

  const loadRecommendations = async () => {
    setRecommendationsLoading(true);
    setRecommendationsError('');
    try {
      let location = userLocation;
      if (!location) {
        if (!navigator.geolocation) {
          throw new Error('La géolocalisation est indisponible sur ce navigateur.');
        }
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 30000,
          });
        });
        location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(location);
      }

      const response = await axios.get(`${API_URL}/api/recommendations`, {
        params: {
          latitude: location.lat,
          longitude: location.lng,
          destination: recommendationDestination,
        },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setRecommendations(response.data || []);
    } catch (requestError) {
      setRecommendationsError(
        requestError.message || 'Impossible de charger les recommandations.'
      );
    } finally {
      setRecommendationsLoading(false);
    }
  };

  const handleRecommendationsToggle = async () => {
    const nextOpen = !recommendationsOpen;
    setRecommendationsOpen(nextOpen);
    if (nextOpen) {
      await loadRecommendations();
    }
  };

  const selectedBusStats = selectedBus
    ? getBusStats({ ...selectedBus, ...tripStats[selectedBus.id] })
    : null;

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
          <div className="dashboard-floating-actions">
            <button
              type="button"
              className={`route-floating-button ${routesPanelOpen ? 'route-floating-button-active' : ''}`}
              onClick={handleTopRoutesToggle}
              aria-expanded={routesPanelOpen}
              aria-controls="top-routes-panel"
              title="Voir les itinéraires les plus utilisés"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 19V5m0 0 4 4m-4-4-4 4M18 5v14m0 0-4-4m4 4 4-4" />
                <circle cx="6" cy="5" r="2" />
                <circle cx="18" cy="19" r="2" />
              </svg>
              <span>Itinéraires</span>
            </button>
            <button
              type="button"
              className={`recommendation-floating-button ${recommendationsOpen ? 'recommendation-floating-button-active' : ''}`}
              onClick={handleRecommendationsToggle}
              aria-expanded={recommendationsOpen}
              aria-controls="recommendations-panel"
              title="Recommander le meilleur bus"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 3 14.8 8.7 21 9.6l-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L12 3Z" />
              </svg>
              <span>Recommandation</span>
            </button>
          </div>
          {routesPanelOpen && (
            <aside id="top-routes-panel" className="top-routes-panel" aria-label="Top 5 des itinéraires">
              <div className="top-routes-header">
                <div>
                  <span className="top-routes-eyebrow">Mobilité campus</span>
                  <h3>Itinéraires les plus utilisés</h3>
                </div>
                <button
                  type="button"
                  className="top-routes-close"
                  onClick={() => setRoutesPanelOpen(false)}
                  aria-label="Fermer"
                >
                  ×
                </button>
              </div>
              {routesLoading ? (
                <p className="top-routes-message">Chargement des itinéraires...</p>
              ) : routesError ? (
                <p className="top-routes-message top-routes-error">{routesError}</p>
              ) : topRoutes.length === 0 ? (
                <p className="top-routes-message">Aucune donnée disponible.</p>
              ) : (
                <ol className="top-routes-list">
                  {topRoutes.slice(0, 5).map((route, index) => (
                    <li key={route.routeId || route.routeCode || index} className="top-route-item">
                      <span className="top-route-rank">{index + 1}</span>
                      <div className="top-route-details">
                        <strong>{route.routeName || route.routeCode || 'Itinéraire'}</strong>
                        <span>{Number(route.totalPassengersTransported || 0).toLocaleString('fr-FR')} passagers transportés</span>
                      </div>
                      <span className="top-route-saturation">
                        {Number(route.averageSaturationRate || 0).toFixed(1)} %
                        <small>saturation</small>
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </aside>
          )}
          {recommendationsOpen && (
            <aside id="recommendations-panel" className="recommendations-panel" aria-label="Recommandations de bus">
              <div className="recommendations-header">
                <div>
                  <span className="recommendations-eyebrow">Assistant mobilité</span>
                  <h3>Meilleur bus pour vous</h3>
                </div>
                <button
                  type="button"
                  className="top-routes-close"
                  onClick={() => setRecommendationsOpen(false)}
                  aria-label="Fermer"
                >
                  ×
                </button>
              </div>
              <label className="recommendation-destination">
                Destination
                <select
                  value={recommendationDestination}
                  onChange={(event) => {
                    setRecommendationDestination(event.target.value);
                    setRecommendations([]);
                  }}
                >
                  <option value="UAC">Université d'Abomey-Calavi (UAC)</option>
                  <option value="ENEAM">ENEAM</option>
                </select>
              </label>
              <button
                type="button"
                className="recommendation-refresh-button"
                onClick={loadRecommendations}
                disabled={recommendationsLoading}
              >
                {recommendationsLoading ? 'Calcul en cours...' : 'Actualiser les recommandations'}
              </button>
              {recommendationsError ? (
                <p className="top-routes-message top-routes-error">{recommendationsError}</p>
              ) : recommendationsLoading ? (
                <p className="top-routes-message">Analyse de votre position et des bus...</p>
              ) : recommendations.length === 0 ? (
                <p className="top-routes-message">Aucun bus disponible pour cette destination.</p>
              ) : (
                <div className="recommendations-list">
                  {recommendations.map((recommendation, index) => (
                    <article
                      key={recommendation.tripId || recommendation.busCode || index}
                      className={`recommendation-card ${index === 0 ? 'recommendation-card-best' : ''}`}
                    >
                      {index === 0 && <span className="recommendation-best-badge">MEILLEUR CHOIX</span>}
                      <h4>{recommendation.busCode || 'Bus'}</h4>
                      <p>Arrêt conseillé : <strong>{recommendation.recommendedStopName}</strong></p>
                      <div className="recommendation-metrics">
                        <span>Arrivée <strong>{recommendation.etaMinutes} min</strong></span>
                        <span>Places <strong>{recommendation.availableSeats}</strong></span>
                        <span>Trajet <strong>{recommendation.totalTravelTime} min</strong></span>
                      </div>
                      <div className="recommendation-score">
                        Score : {Number(recommendation.score || 0).toFixed(2)}/100
                      </div>
                      <p className="recommendation-justification">{recommendation.justification}</p>
                    </article>
                  ))}
                </div>
              )}
            </aside>
          )}
        </div>
      </div>
      {selectedBus && selectedBusStats && (
        <div className="bus-sheet-backdrop" onClick={() => setSelectedBus(null)}>
          <section
            className="bus-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bus-sheet-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="bus-sheet-handle" />
            <div className="bus-sheet-header">
              <div>
                <p className="bus-sheet-eyebrow">Bus sélectionné</p>
                <h3 id="bus-sheet-title">{selectedBus.code || 'Bus'}</h3>
              </div>
              <button
                className="bus-sheet-close"
                type="button"
                aria-label="Fermer"
                onClick={() => setSelectedBus(null)}
              >
                ×
              </button>
            </div>
            <div className="bus-sheet-stats">
              <div className="bus-sheet-stat">
                <strong>{selectedBusStats.availableSeats}</strong>
                <span>Places restantes</span>
              </div>
              <div className="bus-sheet-stat">
                <strong>{selectedBusStats.passengers}</strong>
                <span>Passagers transportés</span>
              </div>
              <div className="bus-sheet-stat">
                <strong>{selectedBusStats.occupancyRate.toFixed(0)} %</strong>
                <span>Taux de remplissage</span>
              </div>
            </div>
            <div className="bus-sheet-capacity">
              <span>
                {selectedBusStats.passengers} passagers, capacité {selectedBusStats.capacity || 'N/A'}
              </span>
              <span>{selectedBusStats.occupancyRate.toFixed(0)} % occupé</span>
            </div>
            <div className="bus-sheet-progress" aria-hidden="true">
              <span style={{ width: `${selectedBusStats.occupancyRate}%` }} />
            </div>
          </section>
        </div>
      )}
      {selectedStop && stopAnalytics[selectedStop.id] && (
        <div className="bus-sheet-backdrop" onClick={() => setSelectedStop(null)}>
          <section
            className="bus-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="stop-sheet-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="bus-sheet-handle" />
            <div className="bus-sheet-header">
              <div>
                <p className="bus-sheet-eyebrow">Arrêt de bus</p>
                <h3 id="stop-sheet-title">{selectedStop.name || 'Arrêt'}</h3>
              </div>
              <button
                className="bus-sheet-close"
                type="button"
                aria-label="Fermer"
                onClick={() => setSelectedStop(null)}
              >
                ×
              </button>
            </div>
            <div className="bus-sheet-stats">
              <div className="bus-sheet-stat">
                <strong>{stopAnalytics[selectedStop.id].totalBoardings}</strong>
                <span>Personnes montées</span>
              </div>
              <div className="bus-sheet-stat">
                <strong>{stopAnalytics[selectedStop.id].totalAlightings}</strong>
                <span>Personnes descendues</span>
              </div>
              <div className="bus-sheet-stat">
                <strong>{stopAnalytics[selectedStop.id].currentWaiting}</strong>
                <span>Personnes en attente</span>
              </div>
            </div>
            <div className="bus-sheet-capacity">
              <span>Temps moyen d'attente</span>
              <span>{stopAnalytics[selectedStop.id].averageWaitingTimeMinutes} minutes</span>
            </div>
            <div className="bus-sheet-progress" aria-hidden="true">
              <span style={{ width: `${Math.min(100, (stopAnalytics[selectedStop.id].currentWaiting / 20) * 100)}%`, background: '#8B5CF6' }} />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
