import React, { useEffect, useState } from 'react';
import { Clock, Users, ChevronDown ,Search, Gavel , TrendingUp} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from "framer-motion";
import AbstractAuctionCard from '../Components/AbstractAuctionCard'; 

const Auctions = () => {
  const [auctions, setAuctions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('ending-soon');
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(6);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [auctionRes, categoryRes] = await Promise.all([
          fetch('http://localhost:3000/auction', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          }),
          fetch('http://localhost:3000/category/all'),
        ]);
        const [auctionData, categoryData] = await Promise.all([
          auctionRes.json(),
          categoryRes.json(),
        ]);
        setAuctions(auctionData.auctions || []);
        setCategories(categoryData.categories || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatTimeLeft = (auction) => {
    const now = new Date();
    const target = new Date(auction.status === 'scheduled' ? auction.startDate : auction.endDate);
    const diffMs = target - now;
    if (diffMs <= 0) return { timeLeft: 'Ended', isEndingSoon: false };
    const totalMinutes = Math.floor(diffMs / 60000);
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;
    return { timeLeft: `${days}d ${hours}h ${minutes}m`, isEndingSoon: days < 1 };
  };

  const filtered = auctions
    .filter((a) =>
      (a.status === 'active' || a.status === 'scheduled') &&
      (filter === 'all' || a.productDetails?.category?.toLowerCase() === filter)
    )
    .map((a) => {
      const { timeLeft, isEndingSoon } = formatTimeLeft(a);
      return {
        id: a.id,
        title: a.productDetails?.name || 'Untitled',
        artist: a.artist?.name || `Artist ID: ${a.artistId}`,
        image: a.productDetails?.image?.[0] || '/fallback.jpg',
        currentBid: a.currentPrice,
        startingBid: a.startingPrice,
        bidCount: a.bidCount,
        timeLeft,
        isEndingSoon,
        endTime: a.endDate,
        description: a.productDetails?.description || '',
        status: a.status,
        category: a.product?.category?.name,
        artistId: a.artistId,
      }

    });

  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case 'ending-soon':
        return a.timeLeft.localeCompare(b.timeLeft);
      case 'price-low':
        return a.currentBid - b.currentBid;
      case 'price-high':
        return b.currentBid - a.currentBid;
      case 'most-bids':
        return b.bidCount - a.bidCount;
      default:
        return 0;
    }
  });

  return (

      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="min-h-screen bg-cream"
      >
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-black/90 mb-4"><span className='font-light'>Live </span>Auctions</h1>
          <p className="text-lg text-burgundy/70">Bid on unique handcrafted items from talented artisans</p>
        </div>

        {/* Filters */}
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-8 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between"
          >

          <div className="flex flex-wrap gap-4">
            <div className="relative">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="appearance-none bg-white border border-coral/30 rounded-md px-4 py-2 pr-8 text-black focus:outline-none focus:ring-2 focus:ring-coral"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.categoryId} value={cat.name.toLowerCase()}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-burgundy pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white border border-coral/30 rounded-md px-4 py-2 pr-8 text-black focus:outline-none focus:ring-2 focus:ring-coral"
              >
                <option value="ending-soon">Ending Soon</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="most-bids">Most Bids</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-burgundy pointer-events-none" />
            </div>
          </div>

          <div className="text-burgundy/70 text-sm">
            Showing {Math.min(visibleCount, sorted.length)} of {sorted.length} auctions
          </div>
        </motion.div>

        {/* Auction Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sorted.slice(0, visibleCount).map((auction, index) => (
            <AbstractAuctionCard key={auction.id} auction={auction} index={index} />
          ))}

        </div>

        {/* Load More */}

        {visibleCount < sorted.length && (
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <button
              onClick={() => setVisibleCount((prev) => prev + 6)}
              className="border border-burgundy/20 text-burgundy hover:bg-burgundy hover:text-cream font-medium px-8 py-3 rounded-md transition duration-300"
            >
              View More Auctions
            </button>
          </motion.div>
        )}


        {/* No auctions */}
        {!loading && sorted.length === 0 && (
          <div className="text-center py-12">
            <p className="text-burgundy/60 text-lg">No auctions found matching your criteria.</p>
          </div>
        )}

        {/* How It Works Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mt-20 bg-cream rounded-xl p-8"
        >
          <h2 className="text-2xl font-bold text-black/90 text-center mb-8">
            How Our Auctions Work
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-coral rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-semibold text-black/90 mb-2">Browse & Discover</h3>
              <p className="text-burgundy/70 text-sm">
                Explore unique handmade items from talented artisans in our live auctions.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-coral rounded-full flex items-center justify-center mx-auto mb-4">
                <Gavel className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-semibold text-black/90 mb-2">Place Your Bid</h3>
              <p className="text-burgundy/70 text-sm">
                Enter your maximum bid and our system will automatically bid for you up to that amount.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-coral rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-semibold text-black/90 mb-2">Win & Enjoy</h3>
              <p className="text-burgundy/70 text-sm">
                If you're the highest bidder when the auction ends, the item is yours!
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Auctions;


