import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((s) => ({ ...s, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // keep same endpoint & headers (no behavioral change)
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/login`,
        formData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
          },
        }
      );
      const { token } = response.data;
      if (!token) {
        throw new Error('No token received from the server');
      }
      localStorage.setItem('token', token);
      // UX: friendly confirmation (unchanged backend behavior)
      alert('Login successful!');
      navigate('/buses');
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Login failed';
      setError(errorMessage);
      console.error('Login error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-root container py-5">
      <div className="row justify-content-center">
        <div className="col-sm-10 col-md-8 col-lg-6">
          <div className="card auth-card shadow-sm border-0">
            <div className="card-body p-4 p-md-5">
              <h2 className="h4 mb-1 text-center">Welcome back</h2>
              <p className="text-center text-muted small mb-4">Log in to continue to the Bus Booking System</p>

              {/* Error */}
              <div aria-live="polite" aria-atomic="true">
                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} noValidate>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label small fw-medium">Email</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className="form-control form-control-lg"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@domain.com"
                    required
                    aria-required="true"
                    aria-label="Email address"
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="password" className="form-label small fw-medium">Password</label>
                  <div className="input-group">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      className="form-control form-control-lg"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      required
                      aria-required="true"
                      aria-label="Password"
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      aria-pressed={showPassword}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword((s) => !s)}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <div className="d-grid">
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    disabled={isSubmitting}
                    aria-disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                        Signing in…
                      </>
                    ) : (
                      'Login'
                    )}
                  </button>
                </div>
              </form>

              <p className="mt-3 mb-0 text-center small text-muted">
                Don't have an account?{' '}
                <Link to="/register" className="text-primary fw-medium">Register</Link>
              </p>
            </div>
          </div>

          <div className="text-center text-muted small mt-3">
            Tip: If you forget your password, use the register page to create a new account.
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
