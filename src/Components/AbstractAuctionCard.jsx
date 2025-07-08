import React, { useEffect, useState } from 'react';
import { Clock, Users, ArrowRight, Star ,PoundSterling } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';

const AbstractAuctionCard = ({ auction, index }) => {
  const navigate = useNavigate();
  const [artistRating, setArtistRating] = useState(null);

  useEffect(() => {
    const fetchArtistRating = async () => {
      try {
        const res = await fetch(`http://localhost:3000/artist/getprofile/${auction.artistId}`);
        const data = await res.json();
        setArtistRating(parseFloat(data.artist.averageRating).toFixed(1));
      } catch (error) {
        console.error('Failed to fetch artist rating:', error);
        setArtistRating('N/A');
      }
    };

    if (auction.artistId) fetchArtistRating();
  }, [auction.artistId]);

    const renderBadge = () => {
      const isEnded = auction.timeLeft === 'Ended';
      const isLive = auction.status === 'active' && !isEnded;
      const isScheduled = auction.status === 'scheduled';
      const isEndingSoon = isLive && auction.timeLeft?.startsWith('0d');

      if (isLive && isEndingSoon) {
        return (
          <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-sm">
            ⏳ ENDING SOON
          </div>
        );
      } else if (isLive) {
        return (
          <div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            LIVE
          </div>
        );
      } else if (isScheduled) {
        return (
          <div className="bg-yellow-400 text-black px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
            <div className="w-2 h-2 bg-black rounded-full animate-bounce" />
            COMING SOON
          </div>
        );
      } else if (isEnded) {
        return (
          <div className="bg-gray-600 text-white px-3 py-1 rounded-full text-xs font-medium">
            ENDED
          </div>
        );
      }

      return null;
    };


  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      whileHover={{ scale: 1.02, y: -5 }}
      viewport={{ once: true }}
      className="group cursor-pointer w-full max-w-[660px] mx-auto"
    >
      <Link to={`/auction/${auction.id}`}>
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100">
          {/* Image Section */}
          <div className="relative overflow-hidden">
            <div className="aspect-[4/3] w-full overflow-hidden">
              <motion.img
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.4 }}
                onError={(e) => { e.target.src = '/default-fallback.jpg'; }} 
                src={auction.image}
                alt={auction.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Hover gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Status Badge */}
            <div className="absolute top-4 right-4">{renderBadge()}</div>

            {/* Time Left */}
            {auction.timeLeft && (
              <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1.5 rounded-lg text-sm font-medium backdrop-blur-sm">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {auction.timeLeft}
                </div>
              </div>
            )}
          </div>

          {/* Card Content */}
          <div className="p-6">
            <div className="mb-3">
              <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-coral transition-colors">
                {auction.title}
              </h3>
              <p className="text-gray-600 text-sm">{auction.artist}</p>
            </div>

            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Current Bid</p>
                <p className="text-2xl font-bold text-gray-900 flex items-center gap-1">
                  <PoundSterling className="h-5 w-5 inline-block" />
                  {auction.currentBid.toLocaleString()}
                </p>

                </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-yellow-400 mb-1">
                  <Star className="h-4 w-4 fill-current" />
                  <span className="text-sm font-medium text-gray-700">
                    {artistRating !== null ? artistRating : '0.0'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {auction.bidCount} bids
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {auction.category}
              </span>
              <motion.div
                whileHover={{ x: 5 }}
                className="flex items-center text-coral font-medium text-sm cursor-pointer"
                onClick={() => navigate(`/auction/${auction.id}`)}
              >
                View Details
                <ArrowRight className="h-4 w-4 ml-1" />
              </motion.div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default AbstractAuctionCard;
