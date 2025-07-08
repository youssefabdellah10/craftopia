import React, { useEffect, useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { PoundSterling } from 'lucide-react';

const SearchResults = () => {
  const location = useLocation();
  const query = new URLSearchParams(location.search).get('q')?.toLowerCase() || '';
  const navigate = useNavigate();

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState(['All']);
  const [products, setProducts] = useState([]);
  const [artists, setArtists] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [filteredArtists, setFilteredArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const [productRes, artistRes, auctionRes] = await Promise.all([
          axios.get('http://localhost:3000/product/get'),
          axios.get('http://localhost:3000/artist/all'),
          axios.get('http://localhost:3000/auction', { headers }),
        ]);

        const allProducts = productRes.data.products || [];
        const allArtists = artistRes.data.artists || [];
        const allAuctions = auctionRes.data.auctions || [];

        setProducts(allProducts);
        setArtists(allArtists);
        setAuctions(allAuctions);

        const extractedCategories = ['All', ...new Set(allProducts.map(p => p.category?.name).filter(Boolean))];
        setCategories(extractedCategories);

        const filteredP = allProducts.filter((p) => {
          const matchesQuery =
            p.name.toLowerCase().includes(query) ||
            p.description?.toLowerCase().includes(query) ||
            p.artist?.name?.toLowerCase().includes(query);

          const matchesCategory =
            selectedCategory === 'All' || p.category?.name === selectedCategory;

          return matchesQuery && matchesCategory;
        });

        const filteredA = allArtists.filter((a) =>
          a.name.toLowerCase().includes(query) ||
          a.username.toLowerCase().includes(query) ||
          a.categories?.some(cat => cat.toLowerCase().includes(query))
        );

        setFilteredProducts(filteredP);
        setFilteredArtists(filteredA);
      } catch (err) {
        console.error('Error fetching search data:', err.response?.status, err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };

    if (query) fetchData();
  }, [query, selectedCategory]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, selectedCategory]);

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getAuctionIdByProductId = (productId) => {
    const auction = auctions.find(a => a.productId === productId);
    return auction?.id;
  };

  if (loading) return <p className="p-8 text-center">Loading search results...</p>;

  return (
    <motion.div
      className="p-8 max-w-6xl mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-2xl font-semibold mb-4">Search Results for "{query}"</h2>

      {categories.length > 1 && (
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="mb-6 border px-4 py-2 rounded-md shadow-sm"
        >
          {categories.map((cat, i) => (
            <option key={i} value={cat}>{cat}</option>
          ))}
        </select>
      )}

      {/* Artists */}
      {filteredArtists.length > 0 && (
        <>
          <h3 className="text-xl font-medium mb-4">Matching Artists</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {filteredArtists.map((artist) => (
              <motion.div
                key={artist.artistId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              >
                <Link
                  to={`/artist-profile-customer/${artist.artistId}`}
                  className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition block"
                >
                  <img
                    src={artist.profilePicture || '/placeholder-artist.png'}
                    alt={artist.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <h4 className="font-bold text-lg mb-1">{artist.name}</h4>
                    <p className="text-sm text-gray-600">{artist.biography}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </>
      )}

      {/* Products */}
      {paginatedProducts.length > 0 && (
        <>
          <h3 className="text-xl font-medium mb-4">Matching Products</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedProducts.map((product) => (
              <motion.div
                key={product.productId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              >
                <div
                  onClick={() => {
                    if (product.type === 'auction') {
                      const auctionId = getAuctionIdByProductId(product.productId);
                      if (auctionId) {
                        navigate(`/auction/${auctionId}`);
                      } else {
                        console.warn('Auction ID not found for product:', product.productId);
                      }
                    } else {
                      navigate(`/product/${product.productId}`, { state: { product } });
                    }
                  }}
                  className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition block cursor-pointer"
                >
                  <img
                    src={product.image?.[0]}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <h4 className="font-bold text-lg mb-1">{product.name}</h4>
                    <p className="text-sm text-gray-600 mb-1">by {product.artist?.name}</p>
                    <p className="text-black/90 font-semibold inline-flex items-center gap-x-1">
                      <PoundSterling className="h-4 w-4 inline-block" />
                      {product.price}
                    </p>
                    <p className={`text-sm font-medium ${product.type === 'auction' ? 'text-amber-600' : 'text-gray-500'}`}>
                      {product.type === 'auction' ? 'Auction' : 'Product'}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}

      {/* Pagination */}
      {filteredProducts.length > itemsPerPage && (
        <div className="flex justify-center mt-6 space-x-2">
          {Array.from({ length: Math.ceil(filteredProducts.length / itemsPerPage) }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1 border rounded-md ${currentPage === i + 1 ? 'bg-coral text-white' : 'bg-white text-gray-700'}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* No Results */}
      {filteredArtists.length === 0 && filteredProducts.length === 0 && (
        <p className="mt-6 text-gray-500 text-center">No results found.</p>
      )}
    </motion.div>
  );
};

export default SearchResults;
