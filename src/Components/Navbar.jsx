import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { AiOutlineHeart, AiOutlineShoppingCart } from 'react-icons/ai';
import { FaUser, FaSearch, FaUserFriends } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [allArtists, setAllArtists] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const blurTimeoutRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const [productsRes, artistsRes, auctionsRes] = await Promise.all([
          axios.get('http://localhost:3000/product/get'),
          axios.get('http://localhost:3000/artist/all'),
          axios.get('http://localhost:3000/auction', { headers }),
        ]);

        setAllProducts(productsRes.data.products || []);
        setAllArtists(artistsRes.data.artists || []);
        setAuctions(auctionsRes.data.auctions || []);
      } catch (err) {
        console.error('Navbar fetch error:', err.response?.data || err.message);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setSuggestions([]);
      return;
    }

    const term = searchTerm.toLowerCase();

    const matchedProducts = allProducts
      .filter(p => p.name.toLowerCase().includes(term))
      .slice(0, 5)
      .map(p => ({ ...p, type: p.type }));

    const matchedArtists = allArtists
      .filter(a => a.name.toLowerCase().includes(term) || a.username.toLowerCase().includes(term))
      .slice(0, 5)
      .map(a => ({ ...a, type: 'artist' }));

    setSuggestions([...matchedProducts, ...matchedArtists]);
  }, [searchTerm, allProducts, allArtists]);

  const getProfileLink = () => {
    if (!user) return '/login';
    if (user.role === 'artist') return '/artist-profile';
    if (user.role === 'admin') return '/admin';
    return '/customer-profile';
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      setSuggestions([]);
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const handleBlur = () => {
    blurTimeoutRef.current = setTimeout(() => {
      setSuggestions([]);
    }, 150);
  };

  const handleSuggestionClick = (item) => {
    clearTimeout(blurTimeoutRef.current);
    setSearchTerm(item.name || item.username);
    setSuggestions([]);

    if (item.type === 'artist') {
      navigate(`/artist-profile-customer/${item.artistId}`);
    } else if (item.type === 'auction') {
      const auction = auctions.find(a => a.productId === item.productId);
      if (auction) {
        navigate(`/auction/${auction.id}`);
      } else {
        console.warn('Auction not found for product', item.productId);
      }
    } else {
      navigate(`/product/${item.productId}`, { state: { product: item } });
    }
  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-200">
      <div className="container mx-auto px-2 flex justify-between items-center py-4">
        <Link
          to="/"
          className="text-4xl font-bold text-gray-900 tracking-wide"
          style={{ fontFamily: "'Lily Script One', cursive" }}
        >
          Craftopia
        </Link>

        <div className="relative w-1/3">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleSearch}
            onBlur={handleBlur}
            placeholder="Search for artists or products..."
            className="w-full border border-coral rounded-full px-5 py-2 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-coral"
          />
          <FaSearch className="absolute right-4 top-2.5 text-gray-600 text-lg" />

          {suggestions.length > 0 && (
            <ul className="absolute z-50 bg-white border border-gray-200 mt-1 w-full rounded-lg shadow-md max-h-60 overflow-y-auto">
              {suggestions.map((item, idx) => (
                <li
                  key={idx}
                  className="px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                  onMouseDown={() => handleSuggestionClick(item)}
                >
                  {item.name || item.username} (
                  {item.type === 'artist'
                    ? 'Artist'
                    : item.type === 'auction'
                    ? 'Auction'
                    : 'Product'}
                  )
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center gap-5 text-gray-700 text-2xl">
          {user?.role === 'customer' && (
            <>
              <AiOutlineHeart
                className="cursor-pointer hover:text-burgundy transition"
                title="Wishlist"
                onClick={() => navigate('/wishlist')}
              />
              <FaUserFriends
                className="cursor-pointer hover:text-burgundy transition"
                title="Following"
                onClick={() => navigate('/following')}
              />
              <AiOutlineShoppingCart
                className="cursor-pointer hover:text-burgundy transition"
                title="Cart"
                onClick={() => navigate('/cart')}
              />
            </>
          )}

          <div
            className="flex items-center space-x-2 cursor-pointer hover:text-burgundy transition"
            onClick={() => navigate(getProfileLink())}
          >
            <FaUser className="text-[1.6rem]" title="Account" />
            <span className="text-base font-medium">
              {user ? 'My Account' : 'Sign In'}
            </span>
          </div>

          {user ? (
            <button
              onClick={() => {
                logout();
                navigate('/');
                window.location.href = '/';
              }}
              className="ml-2 px-4 py-2 text-sm border border-coral rounded-md hover:bg-coral hover:text-white transition"
            >
              Logout
            </button>
          ) : (
            <Link to="/register">
              <button className="ml-2 px-4 py-2 bg-coral text-white rounded-md text-sm hover:bg-burgundy transition">
                Sign Up
              </button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
