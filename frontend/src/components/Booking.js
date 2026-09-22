import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const Booking = () => {
  const [passengers, setPassengers] = useState([{ name: '', age: '', seatNumber: '' }]);
  const [error, setError] = useState('');
  const [bus, setBus] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // show spinner while fetching
  const [isSubmitting, setIsSubmitting] = useState(false); // disable submit while posting
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');

  const busId = new URLSearchParams(location.search).get('busId');
  console.log('Bus ID from URL:', busId);

  useEffect(() => {
    const fetchBus = async () => {
      setIsLoading(true);
      setError('');
      if (!token) {
        setError('Please login to book a ticket');
        navigate('/login');
        setIsLoading(false);
        return;
      }
      if (!busId) {
        setError('No bus ID provided. Please select a bus.');
        setIsLoading(false);
        return;
      }
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/buses/${busId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
          },
        });
        setBus(response.data);
      } catch (err) {
        if (err.response?.status === 401) {
          setError('Session expired. Please login again.');
          localStorage.removeItem('token');
          navigate('/login');
        } else if (err.response?.status === 404) {
          setError('Bus not found. Please select a different bus.');
        } else {
          setError(err.response?.data?.error || err.response?.data?.message || 'Failed to load bus details.');
        }
        console.error('Error fetching bus:', err);
        console.log('Error response:', err.response);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, busId, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Please login to book a ticket');
      navigate('/login');
      return;
    }
    if (!busId) {
      setError('No bus ID provided. Please select a bus.');
      return;
    }
    if (!bus) {
      setError('Bus details not loaded. Please try again.');
      return;
    }

    // Validate passenger fields
    const seatNumbers = new Set();
    for (const p of passengers) {
      if (!p.name || !p.age || !p.seatNumber) {
        setError('Please fill all fields for all passengers');
        return;
      }
      if (seatNumbers.has(p.seatNumber)) {
        setError(`Seat number ${p.seatNumber} is already selected`);
        return;
      }
      // Validate age
      const age = parseInt(p.age);
      if (isNaN(age) || age < 1 || age > 120) {
        setError(`Invalid age for passenger: ${p.age}. Must be between 1 and 120.`);
        return;
      }
      // Validate seat number (assuming format like "A1", extract number for validation)
      const seatNumMatch = p.seatNumber.match(/\d+/);
      if (!seatNumMatch) {
        setError(`Invalid seat number format for ${p.seatNumber}. Include a number (e.g., A1).`);
        return;
      }
      const seatNum = parseInt(seatNumMatch[0]);
      if (isNaN(seatNum) || seatNum < 1 || seatNum > bus.availableSeats) {
        setError(`Seat number ${p.seatNumber} is invalid. Must be between 1 and ${bus.availableSeats}.`);
        return;
      }
      seatNumbers.add(p.seatNumber);
    }

    try {
      setIsSubmitting(true);
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/bookings`,
        { busId: parseInt(busId), passengers },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
          },
        }
      );
      console.log('Booking response:', response.data);
      // improved UX: brief success notice then navigate
      alert('Booking successful!');
      navigate('/profile');
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Session expired. Please login again.');
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setError(err.response?.data?.error || err.response?.data?.message || 'Booking failed');
      }
      console.error('Booking error:', err);
      console.log('Error response:', err.response);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddPassenger = () => {
    setPassengers([...passengers, { name: '', age: '', seatNumber: '' }]);
  };

  const handleChange = (index, e) => {
    const { name, value } = e.target;
    const updatedPassengers = [...passengers];
    updatedPassengers[index][name] = value;
    setPassengers(updatedPassengers);
  };

  return (
    <div className="booking-root container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-7 col-md-9">
          <div className="card booking-card shadow-sm border-0">
            <div className="card-header bg-transparent border-0 px-4 pt-4 pb-0">
              <div className="d-flex align-items-start justify-content-between">
                <div>
                  <h2 className="h4 mb-1">Book Your Ticket</h2>
                  <p className="mb-0 text-muted small">Secure booking — payments handled by backend</p>
                </div>
                {isLoading ? (
                  <div className="spinner-border text-primary" role="status" aria-hidden="true" />
                ) : (
                  bus && (
                    <div className="text-end">
                      <div className="fw-medium">Route</div>
                      <div className="fw-bold">
                        {bus.fromLocation} → {bus.toLocation}
                      </div>
                      <div className="small text-muted">Available Seats: {bus.availableSeats}</div>
                    </div>
                  )
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="card-body px-4 pb-4">
              {/* Error / Success */}
              <div aria-live="polite" aria-atomic="true" className="mb-3">
                {error && (
                  <div className="alert alert-danger mb-0" role="alert">
                    {error}
                  </div>
                )}
              </div>

              {/* If loading bus details */}
              {isLoading && !bus ? (
                <div className="text-center py-4">
                  <div className="spinner-border" role="status" aria-hidden="true" />
                  <div className="mt-2 small text-muted">Loading bus details…</div>
                </div>
              ) : (
                <>
                  {passengers.map((passenger, index) => (
                    <div
                      key={index}
                      className="passenger-block mb-3 p-3 rounded-3 bg-body"
                      style={{ boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.03)' }}
                    >
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <h5 className="mb-0">Passenger {index + 1}</h5>
                        <div className="small text-muted">Enter details</div>
                      </div>

                      <div className="row g-2">
                        <div className="col-sm-6 col-md-4">
                          <label htmlFor={`name-${index}`} className="form-label small fw-medium">
                            Name
                          </label>
                          <input
                            type="text"
                            className="form-control form-control-lg"
                            id={`name-${index}`}
                            name="name"
                            placeholder="Full name"
                            value={passenger.name}
                            onChange={(e) => handleChange(index, e)}
                            aria-label={`Passenger ${index + 1} name`}
                          />
                        </div>

                        <div className="col-sm-3 col-md-2">
                          <label htmlFor={`age-${index}`} className="form-label small fw-medium">
                            Age
                          </label>
                          <input
                            type="number"
                            className="form-control form-control-lg"
                            id={`age-${index}`}
                            name="age"
                            placeholder="Age"
                            value={passenger.age}
                            onChange={(e) => handleChange(index, e)}
                            aria-label={`Passenger ${index + 1} age`}
                            min="1"
                            max="120"
                          />
                        </div>

                        <div className="col-sm-3 col-md-3">
                          <label htmlFor={`seatNumber-${index}`} className="form-label small fw-medium">
                            Seat Number
                          </label>
                          <input
                            type="text"
                            className="form-control form-control-lg"
                            id={`seatNumber-${index}`}
                            name="seatNumber"
                            placeholder="e.g., A1"
                            value={passenger.seatNumber}
                            onChange={(e) => handleChange(index, e)}
                            aria-label={`Passenger ${index + 1} seat number`}
                            title={`Seat number must contain a number and be between 1 and ${bus?.availableSeats ?? 'N'}`}
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="d-flex gap-2 justify-content-between align-items-center mt-3">
                    <button
                      type="button"
                      onClick={handleAddPassenger}
                      className="btn btn-outline-primary btn-lg"
                      aria-label="Add another passenger"
                    >
                      + Add Passenger
                    </button>

                    <div className="text-end">
                      <button
                        type="submit"
                        className="btn btn-primary btn-lg"
                        disabled={isSubmitting}
                        aria-disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                            Booking…
                          </>
                        ) : (
                          'Book Ticket'
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </form>
          </div>

          {/* Small helper note */}
          <div className="text-center text-muted small mt-3">
            Tip: Seat format should include a number (e.g., A1). If you have multiple passengers, add them above.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Booking;
