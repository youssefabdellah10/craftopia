import React, { useEffect, useState } from 'react';
import { Clock, Users, Gavel, ArrowRight, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import AbstractAuctionCard from './AbstractAuctionCard'; 

const formatTimeLeft = (endDate) => {
  const end = new Date(endDate);
  const now = new Date();
  const diff = end - now;

  if (diff <= 0) return 'Ended';

  const mins = Math.floor((diff / 1000 / 60) % 60);
  const hours = Math.floor((diff / 1000 / 60 / 60) % 24);
  const days = Math.floor(diff / 1000 / 60 / 60 / 24);

  return `${days ? `${days}d ` : ''}${hours}h ${mins}m`;
};

const AuctionsSection = () => {
  const [auctions, setAuctions] = useState([]);

  useEffect(() => {
    const fetchAuctions = async () => {
      try {
        const res = await fetch('http://localhost:3000/auction');
        const data = await res.json();
        const mapped = data.auctions
          .filter((a) => a.status === 'active')
          .map((a) => ({
            id: a.id,
            title: a.productDetails.name,
            artist: a.artistName,
            image: a.productDetails.image[0],
            currentBid: a.currentPrice,
            bidCount: a.bidCount,
            timeLeft: formatTimeLeft(a.endDate),
            // rating: 4.8,
            status: a.status,
            category: a.product?.category?.name || 'Handmade',
          }));
        setAuctions(mapped.slice(0, 10)); // Limit to 10
      } catch (err) {
        console.error('Failed to fetch auctions:', err);
      }
    };

    fetchAuctions();
  }, []);

  return (
    <section className="py-24 bg-gradient-cream">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <motion.div
              initial={{ rotate: 0 }}
              whileInView={{ rotate: 15 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="p-4 bg-coral/10 rounded-2xl"
            >
              <Gavel className="h-8 w-8 text-coral" />
            </motion.div>
          </div>
          <h2 className="text-5xl md:text-6xl font-light black/90 mb-6">
            Live <span className="font-bold">Auctions</span>
          </h2>
          <p className="text-xl text-burgundy/80 max-w-2xl mx-auto leading-relaxed">
            Discover and bid on exceptional pieces from the world's most talented artisans
          </p>
        </motion.div>

        {/* Horizontal Scrollable Cards */}
        <div className="overflow-x-auto px-5 py-5 scrollbar-hide">
          <div className="flex gap-8 w-max pr-4">
            {auctions.map((auction, index) => (
                <motion.div
                key={auction.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ scale: 1.05, rotateY: 5 }}
                viewport={{ once: true }}
                className="group cursor-pointer snap-center w-[300px] md:w-[330px] flex-shrink-0"
              >
                <AbstractAuctionCard auction={auction} index={index} />
              </motion.div>
            //  </div>
            ))}
            {/* </div> */}
          </div>
        </div>

        {/* Explore Button */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Link to="/auctions">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-coral hover:bg-burgundy text-white px-12 py-4 rounded-full font-medium text-lg transition-all duration-300 shadow-lg hover:shadow-xl inline-flex items-center gap-3"
            >
              Explore All Auctions
              <ArrowRight className="h-5 w-5" />
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default AuctionsSection;
