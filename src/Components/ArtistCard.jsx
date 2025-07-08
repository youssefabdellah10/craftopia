import React, { useState, useEffect } from 'react';
import { Star, Heart, User, Palette } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const ArtistCard = ({
  artistId,
  name,
  avatar,
  rating,
  followersCount,
  productCount,
  specialties,
  isFollowing = false,
  totalReviews = 0,
  onFollowToggle
}) => {
  const navigate = useNavigate();
  const [following, setFollowing] = useState(isFollowing);


  useEffect(() => {
    setFollowing(isFollowing);
  }, [isFollowing]);

  const handleFollowClick = async () => {
    if (!artistId || isNaN(artistId)) {
      console.error('Invalid artistId:', artistId);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      console.error('User not logged in');
      return;
    }

    try {
      const url = following
        ? `http://localhost:3000/customer/unfollow/${artistId}`
        : `http://localhost:3000/customer/follow/${artistId}`;

      await axios({
        method: following ? 'delete' : 'post',
        url,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setFollowing(!following); 

      if (onFollowToggle) {
        onFollowToggle(artistId);
      }
    } catch (error) {
      console.error('Error toggling follow state:', error);
    }
  };

  const handleViewGallery = () => {
    if (artistId) {
      navigate(`/artist-profile-customer/${artistId}`);
    } else {
      console.error("Artist ID is missing");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 border border-coral/10 group relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blush/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <motion.img
                whileHover={{ scale: 1.1 }}
                src={avatar}
                alt={name}
                className="w-16 h-16 rounded-full object-cover border-3 border-gradient-to-br from-coral to-burgundy shadow-lg"
              />
            </div>
            <div className="flex-1">
              <motion.h3
                whileHover={{ color: '#E94B3C' }}
                className="font-bold text-lg text-burgundy mb-1 transition-colors"
              >
                {name}
              </motion.h3>

              <div className="flex items-center space-x-1">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3 w-3 ${i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
                <span className="text-xs text-burgundy/70 ml-1">
                  {rating}
                  <span className="m-1">({totalReviews})</span>
                </span>
              </div>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleFollowClick}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
              following
                ? 'bg-coral text-white shadow-lg'
                : 'bg-white border-2 border-coral text-coral hover:bg-coral hover:text-white'
            }`}
          >
            <Heart className={`h-3 w-3 ${following ? 'fill-current' : ''}`} />
            <span>{following ? 'Following' : 'Follow'}</span>
          </motion.button>
        </div>

        <div className="flex items-center justify-between mb-4 p-3 bg-card/30 rounded-xl">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Palette className="h-4 w-4 text-coral mr-1" />
            </div>
            <p className="text-xs text-burgundy/60">Products</p>
            <p className="font-bold text-burgundy">{productCount}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
            </div>
            <p className="text-xs text-burgundy/60">Rating</p>
            <p className="font-bold text-burgundy">{rating}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <User className="h-4 w-4 text-coral" />
            </div>
            <p className="text-xs text-burgundy/60">Followers</p>
            <p className="font-bold text-burgundy">{followersCount}</p>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-xs text-burgundy/60 mb-2 font-medium">Specialties</p>
          <div className="flex flex-wrap gap-1">
            {specialties.slice(0, 3).map((specialty, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="inline-block px-2 py-1 bg-gradient-to-r from-coral/10 to-burgundy/10 text-burgundy text-xs rounded-full font-medium border border-coral/20"
              >
                {specialty}
              </motion.span>
            ))}
            {specialties.length > 3 && (
              <span className="inline-block px-2 py-1 bg-burgundy/10 text-burgundy/70 text-xs rounded-full">
                +{specialties.length - 3}
              </span>
            )}
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02, boxShadow: "0 8px 25px rgba(114,47,55,0.3)" }}
          whileTap={{ scale: 0.98 }}
          onClick={handleViewGallery}
          className="w-full bg-gradient-to-r from-coral to-coral/90 hover:from-burgundy/90 hover:to-burgundy text-white py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg"
        >
          View Gallery
        </motion.button>
      </div>
    </motion.div>
  );
};

export default ArtistCard;
