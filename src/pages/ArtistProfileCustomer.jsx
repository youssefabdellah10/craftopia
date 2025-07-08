import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, MapPin, Calendar, Heart, Eye, Users } from 'lucide-react';
import ProductCard from '../Components/ProductCard';
import { useWishlist } from "../context/WishlistContext";
import { useNavigate } from 'react-router-dom';
import Footer from '../Components/Footer';
import { toast } from 'react-hot-toast';
import { useCart } from '../context/CartContext';
import AbstractAuctionCard from '../Components/AbstractAuctionCard';
import { jwtDecode } from "jwt-decode";





const Card = ({ children, className = '' }) => {
  return (
    <div className={`bg-card border border-burgundy/10 rounded-lg shadow-sm ${className}`}>
      {children}
    </div>
  );
};

const CardContent = ({ children, className = '' }) => {
  return (
    <div className={`p-6 ${className}`}>
      {children}
    </div>
  );
};

const Button = ({ children, className = '', variant = 'default', size = 'default', ...props }) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background';

  const variants = {
    default: 'bg-coral text-white hover:bg-coral/90',
    outline: 'border border-burgundy/20 text-burgundy hover:bg-burgundy hover:text-cream',
    ghost: 'hover:bg-accent hover:text-accent-foreground'
  };

  const sizes = {
    default: 'h-10 py-2 px-4',
    sm: 'h-9 px-3'
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

const Badge = ({ children, className = '', variant = 'default' }) => {
  const variants = {
    default: 'bg-primary text-primary-foreground',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
  };

  return (
    <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
};

const Tabs = ({ children, defaultValue, className = '' }) => {
  const [activeTab, setActiveTab] = React.useState(defaultValue);

  return (
    <div className={className}>
      {React.Children.map(children, child =>
        React.cloneElement(child, { activeTab, setActiveTab })
      )}
    </div>
  );
};

const TabsList = ({ children, activeTab, setActiveTab, className = '' }) => {
  return (
    <div className={`inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground grid-cols-4 w-full ${className}`}>
      {React.Children.map(children, child =>
        React.cloneElement(child, { activeTab, setActiveTab })
      )}
    </div>
  );
};

const TabsTrigger = ({ value, children, activeTab, setActiveTab, className = '' }) => {
  return (
    <button
      onClick={() => setActiveTab(value)}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 flex-1 ${activeTab === value ? 'bg-background text-foreground shadow-sm' : ''
        } ${className}`}
    >
      {children}
    </button>
  );
};

const TabsContent = ({ value, children, activeTab, className = '' }) => {
  if (activeTab !== value) return null;

  return (
    <div className={`mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className}`}>
      {children}
    </div>
  );
};
const ArtistProfileCustomer = () => {
  const { id } = useParams();
  const [artist, setArtist] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("gallery");
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productsError, setProductsError] = useState('');
  const [cart, setCart] = useState({});
  const [isFollowing, setIsFollowing] = useState(false);
  const { wishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportMessage, setReportMessage] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [reportSuccess, setReportSuccess] = useState("");
  const [reportError, setReportError] = useState("");
  const navigate = useNavigate();
  const [auctionProducts, setAuctionProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [galleryProducts, setGalleryProducts] = useState([]);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isArtist, setIsArtist] = useState(false);





  const { cartItems, addToCart, incrementQuantity, decrementQuantity } = useCart();
  const mapProduct = (p, artistName = '') => ({
    id: p.productId,
    name: p.name,
    price: p.price,
    originalPrice: null,
    image: Array.isArray(p.image) && p.image.length > 0 ? p.image : ['https://placehold.co/300x300?text=No+Image'],
    quantity: p.quantity || 0,
    inStock: p.quantity > 0,
    description: p.description || '',
    dimensions: p?.dimensions || '',
    material: p.material || '',
    rating: p.averageRating || 0,
    reviews: p.totalReviews || 0,
    isOnSale: false,
    type: p.type,
    category: p.category?.name || 'Handmade',
    artist: artistName,
  });


  useEffect(() => {
    const fetchArtistData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const profileRes = await fetch(`http://localhost:3000/artist/getprofile/${id}`, {
          headers
        });

        const profileData = await profileRes.json();
        const a = profileData.artist;
        if (token) {
          try {
            const decoded = jwtDecode(token);
            setIsOwnProfile(decoded.id === a.userId);

            if (decoded.role === 'artist') {
              setIsArtist(true);
            }
          } catch (err) {
            console.error("Failed to decode token:", err);
          }
        }


        const productRes = await fetch(`http://localhost:3000/product/get/${id}`, {
          headers
        });
        const productData = await productRes.json();

        // Combine and map all types of products
        const mappedNormal = productData.products.map(p => mapProduct(p, 'normal', a.name));
        const mappedAuction = productData.auctionProducts.map(p => mapProduct(p, 'auction', a.name));
        const mappedCustomizable = productData.customizableProducts.map(p => mapProduct(p, 'customizable', a.name));


        setGalleryProducts([...mappedNormal, ...mappedAuction, ...mappedCustomizable]);

        // For "Products" tab only show normal ones
        setProducts(mappedNormal);


        setArtist({
          id: a.artistId,
          name: a.name,
          username: a.username,
          avatar: a.profilePicture || 'https://placehold.co/200x200?text=No+Image',
          coverImage: 'https://images.unsplash.com/photo-1508615121316-fe792af62a63?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
          bio: a.biography,
          joinedDate: new Date(a.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          specialties: a.categories,
          video: a.profileVideo,
          stats: {
            products: productData.products.length,
            sales: Number(a.sales),
            rating: parseFloat(a.averageRating || 0).toFixed(1),
            reviews: a.totalRatings,
            followers: a.numberOfFollowers,
            views: a.visitors
          }
        });

        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch artist or product data:', error);
        setLoading(false);
      }
    };


    fetchArtistData();
  }, [id]);

  useEffect(() => {
    const checkFollowStatus = async () => {

      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await fetch(`http://localhost:3000/customer/followed-artists`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        const followedIds = data.followedArtists.map(a => a.artistId);
        setIsFollowing(followedIds.includes(Number(id)));
      } catch (err) {
        console.error("Error checking follow status:", err);
      }
    };

    checkFollowStatus();

    const fetchAuctionProducts = async () => {
      try {
        const res = await fetch(`http://localhost:3000/auction/artist-product/${id}`);
        const data = await res.json();

        const activeAuctions = data.auctions.filter(a => a.auction.status === 'active' || a.auction.status === 'scheduled');

        const formattedAuctionProducts = activeAuctions.map(a => ({
          id: a.auction.id,
          name: a.auction.productDetails?.name || "Unnamed",
          image: Array.isArray(a.auction.productDetails?.image) && a.auction.productDetails.image.length > 0
            ? a.auction.productDetails.image[0]
            : "https://via.placeholder.com/300",
          description: a.auction.productDetails?.description || "",
          dimensions: a.product?.dimensions || "",
          quantity: a.product?.quantity || 0,
          material: a.product?.material || "",
          currentPrice: a.auction.currentPrice,
          endDate: a.auction.endDate,
          category: a.product?.category?.name || "Uncategorized",
          status: a.auction.status,
        }));

        setAuctionProducts(formattedAuctionProducts);
      } catch (err) {
        console.error("Error fetching auction products", err);
      }
    };


    fetchAuctionProducts();

  }, [id]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch(`http://localhost:3000/review/artist-reviews/${id}`);
        const data = await res.json();

        const allReviews = [];
        data.productReviews.forEach(product => {
          product.reviews.forEach(r => {
            allReviews.push({
              id: r.reviewId,
              rating: r.rating,
              comment: r.review,
              user: r.customerName || r.customerUsername,
              avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${r.customerName}`,
              product: product.productName,
              date: new Date(r.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }),
              verified: true,
            });
          });
        });

        setReviews(allReviews);
      } catch (err) {
        console.error("Failed to fetch reviews", err);
      }
    };

    fetchReviews();
  }, [id]);

  if (loading || !artist) return <div className="text-center py-10 text-burgundy font-medium">Loading artist profile...</div>;

  const isFavorite = (productId) => {
    return wishlist.some((item) => item.id === productId);
  };

  const toggleFavorite = (product) => {
    if (isFavorite(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

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

  const goToProduct = (id) => {
    navigate(`/product/${id}`);
  };
  const handleOpenReport = () => {
  const token = localStorage.getItem("token");

  if (!token) {
    toast.error("Please login to report an artist.");
    return;
  }

  if (isOwnProfile) {
    toast.error("You cannot report your own profile.");
    return;
  }

  setShowReportModal(true);
};



  const handleToggleFollow = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login to follow an artist.");
      // setTimeout(() => navigate("/login"), 1500); 
      return;
    }

    const url = isFollowing
      ? `http://localhost:3000/customer/unfollow/${id}`
      : `http://localhost:3000/customer/follow/${id}`;

    try {
      const res = await fetch(url, {
        method: isFollowing ? "DELETE" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setIsFollowing(!isFollowing);
      } else {
        console.error("Failed to toggle follow state");
      }
    } catch (err) {
      console.error("Error during follow/unfollow:", err);
    }
  };


  const handleReportSubmit = async () => {
    if (!reportMessage.trim()) {
      setReportError("Please enter a message.");
      return;
    }
    if (isOwnProfile) {
      setReportError("You cannot report your own account.");
      return;
    }


    const token = localStorage.getItem("token");
    if (!token) {
      setReportError("You must be logged in to report.");
      return;
    }

    const formData = new FormData();
    formData.append("content", reportMessage);
    if (attachment) {
      formData.append("attachment", attachment);
    }

    try {
      const res = await fetch(`http://localhost:3000/report/createReportArtist/${artist.username}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (res.ok) {
        setReportSuccess("Report submitted successfully.");
        setReportMessage("");
        setAttachment(null);

        setTimeout(() => {
          setReportSuccess("");
          setShowReportModal(false);
        }, 2000);
      } else {
        setReportError(data.message || "Failed to submit report.");
      }
    } catch (err) {
      setReportError("An error occurred while submitting the report.");
    }
  };


  return (
    <div className="min-h-screen bg-cream">
      {/* COVER IMAGE */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} className="relative h-80 overflow-hidden">
        <img src={artist.coverImage} alt="Artist cover" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* HEADER */}
        <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.2 }} className="relative -mt-20 mb-8">
          <Card className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              <img src={artist.avatar} alt={artist.name} className="w-32 h-32 rounded-full object-cover border-4 border-cream shadow-lg" />
              <div className="flex-1 space-y-4">
                <div>
                  <h1 className="text-3xl font-bold text-black font-['Playfair_Display']">{artist.name}</h1>
                  <div className="flex items-center space-x-4 text-black/70 mt-2">
                    <div className="flex items-center space-x-1"><Calendar className="h-4 w-4" /><span>Joined {artist.joinedDate}</span></div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {artist.specialties.map(s => <Badge className='bg-white shadow-sm' key={s.categoryId} variant="outline">{s.name}</Badge>)}
                </div>

                <div className="flex flex-wrap gap-6 text-sm ">
                  <div className="flex items-center space-x-1"><Star className="h-4 w-4 text-yellow-400 fill-current" /><span className="font-semibold">{artist.stats.rating}</span><span className="black/70">({artist.stats.reviews} reviews)</span></div>
                  <div className="flex items-center space-x-1 text-black/80"><Users className="h-4 w-4 text-burgundy/70 " /><span>{artist.stats.followers} followers</span></div>
                  <div className="flex items-center space-x-1 text-black/80"><Eye className="h-4 w-4 text-burgundy/70 " /><span>{artist.stats.views} profile views</span></div>
                </div>
              </div>

              <div className="flex flex-col space-y-3">
                {!isArtist && !isOwnProfile && (
                  <Button
                    className="bg-coral hover:bg-coral/90 text-white"
                    onClick={handleToggleFollow}
                  >
                    {isFollowing ? "following" : "Follow"}
                  </Button>
                )}

              </div>
              {!isOwnProfile && !isArtist && (
                <Button
                  variant="outline"
                  className="text-burgundy border border-burgundy hover:bg-burgundy hover:text-white bg-cream"
                  onClick={handleOpenReport}
                >
                  Report Artist
                </Button>
              )}

            </div>
          </Card>
        </motion.div>

        {/* STATS */}
        <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.4 }} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 text-center bg-white shadow-sm"><div className="text-2xl font-bold text-coral">{artist.stats.products}</div><div className="text-sm text-burgundy/70">Products</div></Card>
          <Card className="p-4 text-center bg-white"><div className="text-2xl font-bold text-coral">{artist.stats.sales}</div><div className="text-sm text-burgundy/70">Total Sales</div></Card>
          <Card className="p-4 text-center bg-white"><div className="text-2xl font-bold text-coral">{artist.stats.rating}</div><div className="text-sm text-burgundy/70">Rating</div></Card>
          <Card className="p-4 text-center bg-white"><div className="text-2xl font-bold text-coral">{artist.stats.followers}</div><div className="text-sm text-burgundy/70">Followers</div></Card>
        </motion.div>

        {/* TABS */}
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-card">
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
            <TabsTrigger value="auctionProducts">Auction Products</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>

          {/* ABOUT TAB */}
          <TabsContent value="about" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="p-6">
                <h3 className="text-xl font-bold text-burgundy mb-4">About Me</h3>
                <p className="text-burgundy/80 leading-relaxed mb-6">{artist.bio}</p>
              </Card>

              <Card className="p-6">
                <h3 className="text-xl font-bold text-burgundy mb-4">Process Video</h3>
                <div className="aspect-video bg-card rounded-lg overflow-hidden mb-4">
                  <video controls className="w-full h-full object-cover">
                    <source src={artist.video} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
                <p className="text-burgundy/80 text-sm">Watch the artist’s creation process and learn their techniques.</p>
              </Card>
            </div>
          </TabsContent>


          <TabsContent value="products" className="space-y-6">
            <h2 className="text-2xl font-bold text-burgundy">Products ({artist.stats.products})</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.filter(p => p.type === 'normal').map((product, index) => (
                <motion.div
                  key={product.productId || product.id || index}
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -3 }}
                >
                  <ProductCard
                    product={product}
                    isFavorite={isFavorite(product.id)}
                    onToggleFavorite={() => toggleFavorite(product)}
                    isInCart={!!cartItems.find((item) => item.id === product.id)}
                    quantity={cartItems.find((item) => item.id === product.id)?.cartQuantity || 0}
                    onAddToCart={() => addToCart(product)}
                    onIncrement={() => {
                      const inCart = cartItems.find((item) => item.id === product.id);
                      if (inCart) incrementQuantity(inCart);
                    }}
                    onDecrement={() => {
                      const inCart = cartItems.find((item) => item.id === product.id);
                      if (inCart && inCart.cartQuantity > 0) decrementQuantity(inCart);
                    }}
                  />

                  {console.log("Rendering product:", product)}
                </motion.div>
              ))}
            </div>
          </TabsContent>


          <TabsContent value="gallery" className="space-y-6">
            <h2 className="text-2xl font-bold text-burgundy">Gallery</h2>

            <div className="mt-4">
              <div className="flex justify-start gap-6 mb-8">

                <div>
                  {loadingProducts && <p className="text-center py-8">Loading products...</p>}
                  {productsError && <p className="text-red-500 text-center py-4">{productsError}</p>}

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {galleryProducts.length === 0 && !loadingProducts && (
                      <p className="col-span-full text-gray-500 py-8">No products found in your gallery.</p>
                    )}

                    {galleryProducts.map((product, index) => (
                      <div
                        key={product.productId || product._id || index}
                        className="relative group overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                      >
                        <div className="aspect-square relative overflow-hidden">
                          <img
                            src={Array.isArray(product.image) ? product.image[0] : product.image || "https://via.placeholder.com/300"}
                            alt={product.name}
                            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                          />

                          {product.type === "customizable" && (
                            <div className="absolute top-3 left-3 bg-yellow-500/90 text-white text-xs font-bold px-2 py-1 rounded-full z-10">
                              CUSTOMIZABLE
                            </div>
                          )}

                          {product.type === "auction" && (
                            <div className="absolute top-3 right-3 bg-[#E07385]/90 text-white text-xs font-bold px-2 py-1 rounded-full z-10">
                              AUCTION
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="auctionProducts" className="space-y-6">
            <h2 className="text-2xl font-bold text-burgundy">Auction Products</h2>
            <div>
              {loadingProducts && <p className="text-center py-8">Loading auction products...</p>}
              {productsError && <p className="text-red-500 text-center py-4">{productsError}</p>}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {auctionProducts.length === 0 && !loadingProducts ? (
                  <p className="col-span-full text-gray-500 py-8">No auction products found.</p>
                ) : (
                  auctionProducts.map((auction, index) => (
                    <motion.div
                      key={auction.id}
                      initial={{ y: 50, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      whileHover={{ scale: 1.03 }}
                      className="group cursor-pointer"
                    >
                      <AbstractAuctionCard
                        auction={{
                          id: auction.id,
                          title: auction.name,
                          image: auction.image,
                          currentBid: auction.currentPrice,
                          bidCount: auction.bidCount || 0,
                          timeLeft: formatTimeLeft(auction.endDate),
                          status: auction.status,
                          category: auction.category || 'Handmade',
                          artist: artist.name, // or artist.username
                        }}
                        index={index}
                      />
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-burgundy">
                Customer Reviews ({artist.stats.reviews})
              </h2>
              <div className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-yellow-400 fill-current" />
                <span className="text-xl font-bold text-burgundy">{artist.stats.rating}</span>
                <span className="text-burgundy/70">average rating</span>
              </div>
            </div>

            <div className="space-y-6">
              {reviews.length === 0 && (
                <p className="text-burgundy/60">No reviews yet.</p>
              )}
              {reviews.map((review) => (
                <Card key={review.id} className="p-6">
                  <div className="flex items-start space-x-4">
                    <img
                      src={review.avatar}
                      alt={review.user}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <span className="font-medium text-burgundy">{review.user}</span>
                          {review.verified && (
                            <Badge variant="outline" className="text-xs">
                              Verified Purchase
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm text-burgundy/60">{review.date}</span>
                      </div>

                      <div className="flex items-center space-x-2 mb-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-burgundy/70">for {review.product}</span>
                      </div>

                      <p className="text-burgundy/80">{review.comment}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

        </Tabs>
      </div>
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-lg p-6 relative transition-all duration-300">
            {reportSuccess ? (
              <div className="text-center py-10">
                <h2 className="text-xl font-bold text-green-600 mb-3">✅ Report Submitted!</h2>
                <p className="text-gray-700">Thank you for helping us keep the community safe.</p>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold text-burgundy mb-4">Report Artist</h2>

                <textarea
                  className="w-full p-3 border rounded-lg bg-white text-sm text-gray-800 mb-4"
                  rows={4}
                  placeholder="Enter your message..."
                  value={reportMessage}
                  onChange={(e) => setReportMessage(e.target.value)}
                />

                <label className="block mb-4">
                  <span className="text-sm font-medium text-burgundy block mb-1">Attach Screenshot (optional)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setAttachment(e.target.files[0])}
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  />
                  {attachment && (
                    <p className="text-sm text-gray-600 mt-1">📎 {attachment.name}</p>
                  )}
                </label>

                {reportError && <p className="text-red-500 text-sm mb-2">{reportError}</p>}
                <div className="flex justify-end gap-3 mt-4">
                  <Button variant="outline" onClick={() => setShowReportModal(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleReportSubmit}>Submit Report</Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      <Footer />

    </div>

  );
};

export default ArtistProfileCustomer;
