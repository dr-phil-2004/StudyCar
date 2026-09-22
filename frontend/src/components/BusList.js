import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const BusList = () => {
  const [buses, setBuses] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchBuses = async () => {
      setIsLoading(true);
      setError('');
      if (!token) {
        setError('Please login to search buses');
        navigate('/login');
        setIsLoading(false);
        return;
      }
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/buses`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
          },
        });
        setBuses(response.data || []);
      } catch (err) {
        if (err.response?.status === 401) {
          setError('Session expired. Please login again.');
          localStorage.removeItem('token');
          navigate('/login');
        } else {
          setError(err.response?.data?.error || err.response?.data?.message || 'Failed to load buses. Please try again.');
        }
        console.error('Error fetching buses:', err);
        console.log('Error response:', err.response);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBuses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, navigate]);

  const handleBook = (busId) => {
    // navigation behavior preserved
    navigate(`/booking?busId=${busId}`);
  };

  const formatPrice = (p) => {
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(p);
    } catch {
      return `$${p}`;
    }
  };

  return (
    <div className="container py-5">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h2 className="mb-0">Available Buses</h2>
        <div className="small text-muted">Find and book seats quickly</div>
      </div>

      {/* Error */}
      {error && (
        <div className="alert alert-danger" role="alert" aria-live="polite">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading ? (
        <div className="row g-3">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="col-md-6">
              <div className="card bus-card-skeleton p-3">
                <div className="skeleton-title mb-2" />
                <div className="skeleton-line short mb-2" />
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div className="skeleton-button" />
                  <div className="skeleton-small" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : buses.length === 0 && !error ? (
        <div className="alert alert-info" role="status">
          No buses available at the moment.
        </div>
      ) : (
        <div className="row g-3">
          {buses.map((bus) => (
            <div key={bus.id} className="col-md-6">
              <article className="card bus-card h-100 shadow-sm border-0" aria-labelledby={`bus-${bus.id}-title`}>
                <div className="card-body d-flex flex-column">
                  <h3 id={`bus-${bus.id}-title`} className="h5 card-title mb-2">
                    <span className="fw-medium">{bus.fromLocation}</span> <span className="text-muted">→</span>{' '}
                    <span className="fw-medium">{bus.toLocation}</span>
                  </h3>

                  <p className="card-text text-muted mb-3" aria-hidden="true">
                    Operator: {bus.operator || '—'} • Duration: {bus.duration || 'N/A'}
                  </p>

                  <div className="d-flex align-items-center justify-content-between mt-auto">
                    <div>
                      <div className="fw-bold fs-6">{formatPrice(bus.price)}</div>
                      <div className="small text-muted">Seats available: {bus.availableSeats}</div>
                    </div>

                    <div className="d-flex flex-column align-items-end">
                      <button
                        onClick={() => handleBook(bus.id)}
                        className="btn btn-primary"
                        aria-label={`Book bus from ${bus.fromLocation} to ${bus.toLocation}`}
                      >
                        Book Now
                      </button>

                      <div className="mt-2 small text-muted">ID: {bus.id}</div>
                    </div>
                  </div>
                </div>
              </article>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BusList;
