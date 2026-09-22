import React, { useState } from 'react';
import axios from 'axios'; // unchanged: default axios
import { Link, useNavigate } from 'react-router-dom';

function Register() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((s) => ({ ...s, [e.target.name]: e.target.value }));
  };

  const validate = () => {
    if (!formData.name.trim()) return 'Name is required';
    if (!formData.email.trim()) return 'Email is required';
    // basic email pattern (client-side only)
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(formData.email)) return 'Please enter a valid email';
    if (!formData.password || formData.password.length < 6) return 'Password must be at least 6 characters';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const clientError = validate();
    if (clientError) {
      setError(clientError);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/register`,
        formData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
          },
          withCredentials: true,
        }
      );
      // preserve original behavior
      alert('Registration successful! Please login.');
      navigate('/login');
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.response?.data?.message || err.response?.data || 'Registration failed';
      setError(errorMessage);
      console.error('Registration error:', err);
      // keep existing logs (status/headers) for debugging
      console.log('Error response:', err.response);
      console.log('Error status:', err.response?.status);
      console.log('Error headers:', err.response?.headers);
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
              <h2 className="h4 mb-1 text-center">Create an account</h2>
              <p className="text-center text-muted small mb-4">Sign up to start booking buses</p>

              <div aria-live="polite" aria-atomic="true">
                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} noValidate>
                <div className="mb-3">
                  <label htmlFor="name" className="form-label small fw-medium">Full name</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    className="form-control form-control-lg"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your full name"
                    required
                    aria-required="true"
                  />
                </div>

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
                      placeholder="At least 6 characters"
                      required
                      aria-required="true"
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-pressed={showPassword}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
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
                        Creating account…
                      </>
                    ) : (
                      'Register'
                    )}
                  </button>
                </div>
              </form>

              <p className="mt-3 mb-0 text-center small text-muted">
                Already have an account?{' '}
                <Link to="/login" className="text-primary fw-medium">Login</Link>
              </p>
            </div>
          </div>

          <div className="text-center text-muted small mt-3">
            By creating an account you agree to our terms. (This is a demo app — no real payments.)
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
