import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { User, Heart, ShoppingCart } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [popupMessage, setPopupMessage] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    try {
      const { data } = await axios.post(
        'http://localhost:3000/auth/login',
        { email, password }
      );
      login(data.token);
      setSuccessMessage('Login successful!');
      if (data.role === 'artist') {
        navigate('/artist-profile');
      } else if (data.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error(err);
      if (err.response?.status === 403) {
        setPopupMessage("Your account has been banned. You will not be able to sign in.");
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 4000);
      } else {
        setError(err.response?.data?.message || 'Login failed');
      }
    }
  };


  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-4 py-8">
      {showPopup && (
        <div className="fixed top-5 right-5 bg-burgundy text-white px-6 py-3 rounded shadow-lg z-50">
          {popupMessage}
        </div>
      )}

      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <svg
              className="h-14 w-14 text-coral animate-bounce"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M5 8h14l-1.5 11H6.5L5 8zm5 0V6a2 2 0 114 0v2"
              />
            </svg>
          </div>

          <h2 className="text-3xl font-bold text-black/90">Welcome Back</h2>
          <p className="mt-2 text-muted-foreground">Sign in to your account</p>
        </div>

        <div className="bg-card rounded-lg shadow-lg p-8">
          {successMessage && (
            <p className="text-green-600 text-center mb-4">
              {successMessage}
            </p>
          )}
          {error && (
            <p className="text-red-500 text-center mb-4">{error}</p>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-burgundy mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-coral focus:border-coral"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-burgundy mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border bg-white border-gray-300 rounded-md focus:ring-2 focus:outline-none focus:ring-coral focus:border-coral"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-coral text-white py-2 px-4 rounded-md font-semibold hover:bg-burgundy transition-colors"
            >
              Sign In
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/register" className="text-coral hover:text-burgundy font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <h3 className="text-lg font-semibold text-burgundy mb-4">Why join Craftopia?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-burgundy/70">
            <div>
              <div className="w-12 h-12 bg-coral/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <User className="h-6 w-6 text-coral" />
              </div>
              <p>Connect with talented artisans</p>
            </div>
            <div>
              <div className="w-12 h-12 bg-coral/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <Heart className="h-6 w-6 text-coral" />
              </div>
              <p>Discover unique handcrafted items</p>
            </div>
            <div>
              <div className="w-12 h-12 bg-coral/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <ShoppingCart className="h-6 w-6 text-coral" />
              </div>
              <p>Support local craftspeople</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
