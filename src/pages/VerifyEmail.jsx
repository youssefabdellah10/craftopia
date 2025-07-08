import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Heart, ShoppingCart, CheckCircle } from 'lucide-react';

const VerifyEmail = () => {
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const userId = location.state?.userId || localStorage.getItem('userId') || '';

  useEffect(() => {
    if (userId) {
      localStorage.setItem('userId', userId);
    } else {
      navigate('/register');
    }
  }, [userId, navigate]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      await axios.post('http://localhost:3000/auth/verify-email', {
        userId,
        otpCode,
      });

      setSuccessMessage('Email verified successfully!');
      setTimeout(() => {
        localStorage.removeItem('userId');
        navigate('/login');
      }, 1500);
    } catch (err) {
      const message = err.response?.data?.message || 'Verification failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      await axios.post('http://localhost:3000/auth/resend-otp', { userId });
      setSuccessMessage('OTP resent successfully!');
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to resend OTP';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-14 h-14 text-coral animate-pulse" />
          </div>
          <h2 className="text-3xl font-extrabold text-black/90">Verify Your Email</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter the OTP code sent to your email to confirm your account
          </p>
        </div>

        <div className="bg-card rounded-2xl shadow-xl p-8 border border-gray-100">
          {successMessage && (
            <p className="text-green-600 text-center mb-4 font-medium">{successMessage}</p>
          )}
          {error && (
            <p className="text-red-500 text-center mb-4 font-medium">{error}</p>
          )}

          <form onSubmit={handleVerify} className="space-y-6">
            <div className="group">
              <label htmlFor="otp" className="block text-sm font-medium text-burgundy mb-2">
                OTP Code <span className="text-red-500">*</span>
              </label>
              <input
                id="otp"
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                required
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral focus:border-coral transition duration-200 ease-in-out"
                placeholder="Enter your OTP code"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 px-4 rounded-lg font-semibold transition-colors 
                ${loading ? 'bg-coral/70 cursor-not-allowed' : 'bg-coral hover:bg-burgundy'} text-white shadow-md`}
            >
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <button
              onClick={handleResend}
              disabled={loading}
              className="text-coral hover:text-burgundy font-medium underline text-sm transition duration-150"
            >
              Resend OTP
            </button>
          </div>
        </div>

        <div className="mt-10 text-center">
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

export default VerifyEmail;
