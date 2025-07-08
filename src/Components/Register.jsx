import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { User, Heart, ShoppingCart } from 'lucide-react';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('customer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      setLoading(false);
      return;
    }

    try {
      const { data } = await axios.post('http://localhost:3000/auth/register', {
        email,
        password,
        role,
      });

      setSuccessMessage('Registration successful! Please verify your email.');
      setTimeout(() => {
        setLoading(false);
        navigate('/verify-email', { state: { userId: data.userId } });
      }, 1500);

    } catch (err) {
      console.error(err);
      const backendMessage = err.response?.data?.message || 'Registration failed';
      let friendlyMessage = '';

      if (
        backendMessage.toLowerCase().includes('email') ||
        backendMessage.toLowerCase().includes('user already exists')
      ) {
        friendlyMessage = 'Email is already in use.';
      } else if (backendMessage.toLowerCase().includes('password')) {
        friendlyMessage = 'There was a problem with your password.';
      } else {
        friendlyMessage = backendMessage;
      }

      setError(friendlyMessage);
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-4 py-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-black/90">Create Account</h2>
          <p className="mt-2 text-muted-foreground">Sign up to get started</p>
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

          <form onSubmit={handleRegister} className="space-y-6">
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
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-coral focus:border-coral"
                placeholder="Enter your password"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-burgundy mb-2">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-coral focus:border-coral"
                placeholder="Re-enter your password"
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-burgundy mb-2">
                I am a
              </label>
              <div className="relative">
                <select
                  id="role"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  required
                  className="appearance-none w-full px-4 py-2 border bg-white border-gray-300 rounded-md focus:ring-2 focus:ring-coral focus:border-coral pr-10"
                >
                  <option value="customer">Customer</option>
                  <option value="artist">Artist</option>
                </select>
                <svg
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-coral w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 px-4 rounded-md font-semibold transition-colors 
                      ${loading ? 'bg-coral/70 cursor-not-allowed' : 'bg-coral hover:bg-burgundy'} text-white`}
            >
              {loading ? 'Registering...' : 'Sign Up'}
            </button>

          </form>


          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-coral hover:text-burgundy font-medium">
                Sign in
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

export default Register;
