import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import './App.css';

/* Lazy-load pages to improve first paint */
const Login = lazy(() => import('./components/Login'));
const Register = lazy(() => import('./components/Register'));
const Booking = lazy(() => import('./components/Booking'));
const BusList = lazy(() => import('./components/BusList'));
const Profile = lazy(() => import('./components/Profile'));

/* Small spinner/fallback while components load */
const LoadingFallback = () => (
  <div className="d-flex align-items-center justify-content-center py-5" role="status" aria-live="polite">
    <div className="spinner-border" role="status" aria-hidden="true" />
    <span className="visually-hidden">Loading...</span>
  </div>
);

/* Inline hero for root route (same content, improved semantics) */
const HomeHero = () => (
  <main
    role="main"
    className="welcome-container d-flex align-items-center justify-content-center min-vh-100"
    style={{
      backgroundImage: 'url("https://images.unsplash.com/photo-1507525428034-b723cf961d3e")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
    }}
  >
    <div
      className="text-center text-white p-5 rounded shadow-lg"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
    >
      <h1 className="display-4 mb-4">Welcome to Bus Booking System</h1>
      <p className="lead mb-4">Book your bus tickets easily and travel hassle-free!</p>
      <div>
        <Link to="/login" className="btn btn-primary btn-lg mx-2">Login</Link>
        <Link to="/register" className="btn btn-outline-light btn-lg mx-2">Register</Link>
      </div>
    </div>
  </main>
);

function App() {
  return (
    <Router basename="/">
      <div>
        <Navbar />

        {/* Suspense wraps the route set so each lazy component can load on demand.
            Fallback is accessible and minimal — purely UI-level. */}
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/buses" element={<BusList />} />
            <Route path="/booking" element={<Booking />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/" element={<HomeHero />} />
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
}

export default App;
