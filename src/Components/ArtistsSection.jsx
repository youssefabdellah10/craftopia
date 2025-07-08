import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Award, Star, Palette, Users, ArrowRight } from 'lucide-react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useNavigate, Link } from 'react-router-dom';

const ArtistsSection = () => {
  const [artists, setArtists] = useState([]);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:3000/artist/all', {
          headers: { Authorization: `Bearer ${token}` },
        });

        const formatted = (response.data.artists || []).slice(0, 10).map((artist) => ({
          id: artist.artistId,
          name: artist.name,
          specialty: artist.categories?.join(', ') || 'N/A',
          image: artist.profilePicture || 'https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_640.png',
          rating: parseFloat(artist.averageRating || 0).toFixed(1),
          products: artist.numberOfProducts || 0,
          followers: artist.numberOfFollowers || 0,
          verified: artist.verified,
        }));

        setArtists(formatted);
      } catch (error) {
        console.error('Failed to fetch artists:', error);
      }
    };

    fetchArtists();
  }, []);

  const updateScrollButtons = () => {
    const container = scrollRef.current;
    if (!container) return;
    const { scrollLeft, scrollWidth, clientWidth } = container;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);
  };

  const handleScroll = (direction) => {
    const container = scrollRef.current;
    if (!container) return;
    const cardWidth = container.firstChild?.offsetWidth || 270;
    container.scrollBy({
      left: direction === 'right' ? cardWidth + 24 : -cardWidth - 24,
      behavior: 'smooth',
    });
    setTimeout(updateScrollButtons, 300);
  };

  useEffect(() => {
    updateScrollButtons();
    const container = scrollRef.current;
    container?.addEventListener('scroll', updateScrollButtons);
    return () => container?.removeEventListener('scroll', updateScrollButtons);
  }, [artists]);

  return (
    <section className="py-20 bg-cream overflow-hidden">
      <div className="container mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-black/90 mb-4">
            Meet Our Artists
          </h2>
          <p className="text-xl text-burgundy/80 max-w-2xl mx-auto">
            Discover the talented creators behind our beautiful handcrafted pieces
          </p>
        </motion.div>

        {canScrollLeft && (
          <button
            onClick={() => handleScroll('left')}
            className="absolute -left-6 top-1/2 -translate-y-1/2 z-20 bg-white border border-gray-200 shadow-md rounded-lg p-2 hover:bg-[#fbe9ed] transition"
          >
            <FiChevronLeft className="text-[#921A40] text-2xl" />
          </button>
        )}
        {canScrollRight && (
          <button
            onClick={() => handleScroll('right')}
            className="absolute -right-6 top-1/2 -translate-y-1/2 z-20 bg-white border border-gray-200 shadow-md rounded-lg p-2 hover:bg-[#fbe9ed] transition"
          >
            <FiChevronRight className="text-[#921A40] text-2xl" />
          </button>
        )}

        <motion.div
          ref={scrollRef}
          className="flex gap-8 overflow-x-auto px-5 py-5 scrollbar-hide snap-x snap-mandatory"
          style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          {artists.map((artist, index) => (
            <motion.div
              key={artist.id}
              initial={{ opacity: 0, y: 50, rotateY: -10 }}
              whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ scale: 1.05, rotateY: 5 }}
              viewport={{ once: true }}
              className="group cursor-pointer snap-center w-[300px] flex-shrink-0"
            >
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-coral/10 text-center">
                <div className="relative mb-6">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.3 }}
                    className="relative inline-block"
                  >
                    <img
                      src={artist.image}
                      alt={artist.name}
                      className="w-20 h-20 rounded-full mx-auto object-cover ring-4 ring-blush group-hover:ring-coral transition-all duration-300"
                    />
                    {artist.verified && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                        className="absolute -bottom-1 -right-1 bg-coral text-white rounded-full p-1"
                      >
                        <Award className="h-3 w-3" />
                      </motion.div>
                    )}
                  </motion.div>
                </div>

                <h3 className="text-lg font-semibold text-burgundy mb-1">
                  {artist.name}
                </h3>
                <p className="text-coral font-medium mb-2">{artist.specialty}</p>
                <div className="flex items-center justify-between text-sm text-burgundy/70 mb-4">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                    <span>{artist.rating}</span>
                  </div>
                  <div className="flex items-center">
                    <Palette className="h-4 w-4 mr-1" />
                    <span>{artist.products}</span>
                  </div>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    <span>{artist.followers}</span>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05, backgroundColor: '#722F37', color: '#F5F3F0' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(`/artist-profile-customer/${artist.id}`)}
                  className="w-full bg-coral/90 hover:bg-burgundy text-cream hover:text-white py-2 rounded-lg font-medium transition-all duration-300"
                >
                  View Profile
                </motion.button>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Link to="/artists">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-coral hover:bg-burgundy text-white px-12 py-4 rounded-full font-medium text-lg transition-all duration-300 shadow-lg hover:shadow-xl inline-flex items-center gap-3"
            >
              Discover All Artists
              <ArrowRight className="h-5 w-5" />
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default ArtistsSection;
