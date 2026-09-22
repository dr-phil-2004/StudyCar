import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      setError('');
      if (!token) {
        setError('Please login to view your profile');
        navigate('/login');
        setIsLoading(false);
        return;
      }
      try {
        const userResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/users/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
          },
        });
        setUser(userResponse.data);
        setFormData({ name: userResponse.data.name, email: userResponse.data.email, password: '' });

        const bookingsResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/bookings/history`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
          },
        });
        setBookings(bookingsResponse.data || []);
      } catch (err) {
        if (err.response?.status === 401) {
          setError('Session expired. Please login again.');
          localStorage.removeItem('token');
          navigate('/login');
        } else {
          setError(err.response?.data?.error || err.response?.data?.message || 'Failed to load profile');
        }
        console.error('Profile error:', err);
        console.log('Error response:', err.response);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, navigate]);

  const handleEditToggle = () => {
    setIsEditing((s) => !s);
    setError('');
    setFormData((f) => ({ ...f, password: '' }));
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setIsUpdating(true);

    try {
      const updateRequest = {
        name: formData.name,
        email: formData.email,
        password: formData.password || null,
      };
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/users/profile`,
        updateRequest,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
          },
        }
      );
      setUser(response.data);
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Session expired. Please login again.');
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setError(err.response?.data?.error || err.response?.data?.message || 'Failed to update profile');
      }
      console.error('Update error:', err);
      console.log('Error response:', err.response);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="profile-root container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-9 col-md-10">
          <div className="card profile-card shadow-sm border-0">
            <div className="card-header bg-transparent border-0 px-4 pt-4 pb-0 d-flex align-items-start justify-content-between">
              <div>
                <h2 className="h5 mb-0">Your Profile</h2>
                <div className="small text-muted">Manage your details and view booking history</div>
              </div>
              <div className="text-end">
                {user && <div className="small text-muted">Member: <strong>{user.id}</strong></div>}
              </div>
            </div>

            <div className="card-body px-4 pb-4">
              <div aria-live="polite" aria-atomic="true" className="mb-3">
                {error && (
                  <div className="alert alert-danger mb-0" role="alert">
                    {error}
                  </div>
                )}
              </div>

              {isLoading ? (
                <div className="text-center py-4">
                  <div className="spinner-border" role="status" aria-hidden="true" />
                  <div className="mt-2 small text-muted">Loading profile…</div>
                </div>
              ) : (
                <>
                  {/* Profile card */}
                  {user && (
                    <section className="mb-4">
                      <div className="d-flex flex-column flex-md-row gap-3 align-items-start">
                        <div className="profile-summary p-3 rounded-3 bg-body">
                          <div className="d-flex align-items-center gap-3">
                            <div className="avatar-placeholder rounded-circle d-flex align-items-center justify-content-center">
                              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div>
                              <div className="fw-bold">{user.name}</div>
                              <div className="small text-muted">{user.email}</div>
                            </div>
                          </div>

                          <div className="mt-3">
                            {!isEditing ? (
                              <button className="btn btn-outline-primary btn-sm" onClick={handleEditToggle}>
                                Edit Profile
                              </button>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex-fill">
                          {!isEditing ? (
                            <div className="p-3 rounded-3 bg-body">
                              <div className="d-flex justify-content-between align-items-center">
                                <div>
                                  <div className="small text-muted">Registered on</div>
                                  <div className="fw-medium">{new Date(user.createdAt || Date.now()).toLocaleDateString()}</div>
                                </div>
                                <div>
                                  <div className="small text-muted">Email Verified</div>
                                  <div className="fw-medium">{user.verified ? 'Yes' : 'No'}</div>
                                </div>
                              </div>
                              <div className="mt-3 small text-muted">
                                Want to change details? Click Edit Profile.
                              </div>
                            </div>
                          ) : (
                            <form onSubmit={handleUpdate} className="p-3 rounded-3 bg-body">
                              <div className="row g-2">
                                <div className="col-md-6 mb-2">
                                  <label htmlFor="name" className="form-label small fw-medium">Name</label>
                                  <input
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="form-control form-control-lg"
                                    required
                                    aria-required="true"
                                  />
                                </div>
                                <div className="col-md-6 mb-2">
                                  <label htmlFor="email" className="form-label small fw-medium">Email</label>
                                  <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="form-control form-control-lg"
                                    required
                                    aria-required="true"
                                  />
                                </div>
                                <div className="col-12 mb-2">
                                  <label htmlFor="password" className="form-label small fw-medium">New Password (optional)</label>
                                  <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="form-control form-control-lg"
                                    placeholder="Leave blank to keep current password"
                                  />
                                </div>
                              </div>

                              <div className="d-flex gap-2 justify-content-end mt-2">
                                <button type="button" className="btn btn-outline-secondary" onClick={handleEditToggle} disabled={isUpdating}>
                                  Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={isUpdating} aria-disabled={isUpdating}>
                                  {isUpdating ? (
                                    <>
                                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                                      Saving…
                                    </>
                                  ) : (
                                    'Save Changes'
                                  )}
                                </button>
                              </div>
                            </form>
                          )}
                        </div>
                      </div>
                    </section>
                  )}

                  {/* Booking history */}
                  <section>
                    <h5 className="mb-3">Booking History</h5>

                    {bookings.length === 0 ? (
                      <div className="p-3 rounded-3 bg-body text-center text-muted">No bookings found.</div>
                    ) : (
                      <div className="table-responsive">
                        <table className="table table-hover align-middle">
                          <thead>
                            <tr>
                              <th>Booking ID</th>
                              <th>Bus Route</th>
                              <th>Booking Time</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bookings.map((booking) => (
                              <tr key={booking.id}>
                                <td>{booking.id}</td>
                                <td>
                                  {booking.bus?.fromLocation ?? '—'} → {booking.bus?.toLocation ?? '—'}
                                </td>
                                <td>{booking.bookingTime ? new Date(booking.bookingTime).toLocaleString() : '—'}</td>
                                <td>
                                  <span className={`badge ${booking.status === 'CONFIRMED' ? 'bg-success' : booking.status === 'CANCELLED' ? 'bg-danger' : 'bg-secondary'}`}>
                                    {booking.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
