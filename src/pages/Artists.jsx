import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ArtistCard from '../Components/ArtistCard';
import Footer from '../Components/Footer';

const Artists = () => {
  const [artists, setArtists] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('rating');

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');

        const [allArtistsRes, categoriesRes] = await Promise.all([
          axios.get('http://localhost:3000/artist/all'),
          axios.get('http://localhost:3000/category/all'),
        ]);

        let followedArtistIds = [];

        // ✅ Try to fetch followed artists, but don't break everything if it fails
        if (token) {
          try {
            const followedRes = await axios.get(
              'http://localhost:3000/customer/followed-artists',
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            followedArtistIds = followedRes.data.followedArtists?.map((a) => a.artistId) || [];
          } catch (followErr) {
            console.warn('User not logged in or unauthorized to fetch followed artists.');
            // It's safe to ignore this if token is invalid/expired.
          }
        }

        // Merge isFollowing
        const updatedArtists = allArtistsRes.data.artists.map((artist) => ({
          ...artist,
          isFollowing: followedArtistIds.includes(artist.artistId),
        }));

        setArtists(updatedArtists);
        setCategories(categoriesRes.data.categories || []);
      } catch (error) {
        console.error('Error fetching artist or category data:', error);
      }
    };

    fetchData();
  }, []);


  const filteredArtists = artists.filter((artist) =>
    filter === 'all' ||
    artist.categories.some((cat) => cat.toLowerCase().replace(/\s+/g, '-') === filter)
  );

  const sortedArtists = [...filteredArtists].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return parseFloat(b.averageRating) - parseFloat(a.averageRating);
      case 'reviews':
        return b.numberOfFollowers - a.numberOfFollowers;
      case 'price-low':
        return parseFloat(a.lowestPrice) - parseFloat(b.lowestPrice);
      case 'price-high':
        return parseFloat(b.lowestPrice) - parseFloat(a.lowestPrice);
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  const handleViewGallery = (artistId) => {
    navigate(`/artist/${artistId}`);
  };

  const handleToggleFollow = async (artistId) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const targetArtist = artists.find(a => a.artistId === artistId);
    const isCurrentlyFollowing = targetArtist?.isFollowing;

    const url = isCurrentlyFollowing
      ? `http://localhost:3000/customer/unfollow/${artistId}`
      : `http://localhost:3000/customer/follow/${artistId}`;

    try {
      const res = await fetch(url, {
        method: isCurrentlyFollowing ? "DELETE" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const updated = artists.map((artist) =>
          artist.artistId === artistId
            ? { ...artist, isFollowing: !isCurrentlyFollowing }
            : artist
        );
        setArtists(updated);
      } else {
        console.error("Failed to toggle follow state");
      }
    } catch (err) {
      console.error("Error during follow/unfollow:", err);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-cream">
        <div className="container mx-auto px-4 py-10">
          <div className="mb-10 text-center md:text-left">
            <h2 className="text-xl md:text-2xl font-semibold text-black/90">
              Discover talented artisans and their unique creations
            </h2>
          </div>

          {/* Filter & Sort Controls */}
          <div className="mb-10 bg-blush/40 border border-coral/20 rounded-2xl shadow-md p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            {/* Category Filter */}
            <div className="relative w-full md:w-auto">
              <label className="text-burgundy text-sm font-medium block mb-1 ml-1">Category</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="appearance-none bg-white border border-coral/30 rounded-lg px-4 py-2 pr-10 text-burgundy shadow-sm focus:outline-none focus:ring-2 focus:ring-coral w-full md:w-60"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.categoryId} value={cat.name.toLowerCase().replace(/\s+/g, '-')}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-[3.4rem] md:top-[2.75rem] transform -translate-y-1/2 h-4 w-4 text-burgundy pointer-events-none" />
            </div>

            {/* Sort Dropdown */}
            <div className="relative w-full md:w-auto">
              <label className="text-burgundy text-sm font-medium block mb-1 ml-1">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white border border-coral/30 rounded-lg px-4 py-2 pr-10 text-burgundy shadow-sm focus:outline-none focus:ring-2 focus:ring-coral w-full md:w-60"
              >
                <option value="rating">Highest Rated</option>
                <option value="reviews">Most Reviews</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Name A-Z</option>
              </select>
              <ChevronDown className="absolute right-3 top-[3.4rem] md:top-[2.75rem] transform -translate-y-1/2 h-4 w-4 text-burgundy pointer-events-none" />
            </div>

            <div className="text-sm text-burgundy/70 mt-2 md:mt-7 ml-auto">
              {sortedArtists.length} artist{sortedArtists.length !== 1 && 's'} found
            </div>
          </div>

          {/* Artist Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sortedArtists.map((artist) => (
              <ArtistCard
                key={artist.artistId}
                artistId={artist.artistId}
                name={artist.name}
                avatar={
                  artist.profilePicture ||
                  'https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_640.png'
                }
                rating={parseFloat(artist.averageRating)}
                followersCount={parseInt(artist.numberOfFollowers)}
                productCount={parseInt(artist.numberOfProducts)}
                specialties={artist.categories || []}
                isFollowing={artist.isFollowing}
                totalReviews={artist.totalReviews}
                isVerified={true}
                onViewGallery={() => handleViewGallery(artist.artistId)}
                onToggleFollow={() => handleToggleFollow(artist.artistId)}
              />

            ))}
          </div>

          {sortedArtists.length === 0 && (
            <div className="text-center py-12">
              <p className="text-burgundy/60 text-lg">No artists found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Artists;
