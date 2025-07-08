import { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Heart, Search, User } from 'lucide-react';
import Footer from './Footer';
import ArtistCard from './ArtistCard';
import { Button } from './Button';
import { useNavigate } from 'react-router-dom';

const Following = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [followedArtists, setFollowedArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFollowedData = async () => {
      try {
        const token = localStorage.getItem('token');

        const res = await axios.get('http://localhost:3000/customer/followed-artists', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const artists = Array.isArray(res.data.followedArtists) ? res.data.followedArtists : [];
        setFollowedArtists(artists);
      } catch (err) {
        console.error('❌ Failed to fetch followed data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFollowedData();
  }, []);

  const filteredArtists = followedArtists.filter((artist) =>
    artist.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFollowToggle = (artistName, isFollowing) => {
    console.log(`${isFollowing ? 'Followed' : 'Unfollowed'} ${artistName}`);
  };

  if (loading) return <div className="text-center py-20 text-burgundy">Loading...</div>;

  return (
    <div className="min-h-screen bg-cream">
      <div className="container mx-auto px-4 py-8 min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-4">
            <Heart className="h-8 w-8 text-coral fill-coral mr-3" />
            <h1 className="text-4xl md:text-5xl font-bold text-burgundy">Following</h1>
          </div>
          <p className="text-lg text-burgundy/70 max-w-2xl mx-auto">
            Stay connected with your favorite artists and discover their latest creations
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-8"
        >
          <div className="text-burgundy font-semibold text-lg">
            Artists ({followedArtists.length})
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-burgundy/60 h-4 w-4" />
            <input
              placeholder="Search artists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full border border-coral/30 rounded-md py-2 bg-white focus:outline-none focus:border-coral"
            />
          </div>
        </motion.div>
        <>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-burgundy flex items-center">
              <Heart className="h-6 w-6 text-coral fill-coral mr-2" />
              Artists You Follow
            </h2>
            <span className="text-burgundy/60">{filteredArtists.length} artists</span>
          </div>

          {filteredArtists.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center bg-[#F6EEEE] text-[#921A40] p-12 rounded-3xl shadow-2xl border border-pink-100">
              <div className="text-7xl mb-4 animate-bounce">💔</div>
              <h3 className="text-3xl font-extrabold mb-3 tracking-tight">
                You’re Not Following Any Artists Yet
              </h3>
              <p className="text-gray-600 max-w-md mb-8 leading-relaxed">
                Discover amazing creators and follow them to see their latest works.
              </p>
              <Button
                onClick={() => navigate("/artists")}
                className="bg-[#E07385] hover:bg-[#d85c6f] text-white font-semibold py-3 px-8 rounded-full transition duration-300 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
              >
                Explore Artists
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredArtists.map((artist, index) => (
                <motion.div
                  key={artist.artistId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <ArtistCard
                    artistId={artist.artistId}
                    name={artist.name}
                    avatar={artist.profilePicture || "https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_640.png"}
                    location="Unknown"
                    rating={4.8}
                    reviewCount={20}
                    productCount={10}
                    specialties={[]}
                    isFollowing={true}
                    isVerified={true}
                    onFollowToggle={() => handleFollowToggle(artist.name, true)}
                  />
                </motion.div>
              ))}

            </div>
          )}
        </>
      </div>

      <Footer />
    </div>
  );
};

export default Following;
