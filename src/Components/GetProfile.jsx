import { useState, useEffect } from "react";
import {
  Star,
  ChatCircleDots,
  Coins
} from "phosphor-react";

const GetProfile = ({ setActiveTab }) => {
  const [profile, setProfile] = useState(null);
  const [message, setMessage] = useState("");
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productsError, setProductsError] = useState("");
  const [activeSection, setActiveSection] = useState("gallery");
  const [showFullBio, setShowFullBio] = useState(false);
  const [auctionProducts, setAuctionProducts] = useState([]);
  const [customizedProducts, setCustomizedProducts] = useState([]);


  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch("http://localhost:3000/artist/myprofile", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (!response.ok) throw new Error("Failed to fetch profile");

        const data = await response.json();
        setProfile(data.ArtistProfile);
      } catch (err) {
        console.error(err);
        setMessage("Please complete your profile.");
      }
    };

    fetchProfile();
  }, []);

  useEffect(() => {
    if (!profile || !profile.artistId) return;

    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const res = await fetch(`http://localhost:3000/product/get/${profile.artistId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch products");

        const data = await res.json();
        setProducts(data.products || []);
        setCustomizedProducts(data.customizableProducts || []);
        setProductsError("");
      } catch (err) {
        console.error(err);
        setProductsError("Failed to load gallery products.");
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, [profile]);

  useEffect(() => {
    if (!profile || !profile.artistId) return;

    const fetchAuctionProducts = async () => {
      try {
        const res = await fetch(`http://localhost:3000/auction/artist-product/${profile.artistId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch auction products");

        const data = await res.json();

        setAuctionProducts(
          data.products
            .filter(p => p.type === 'auction')
            .map((p) => ({
              id: p.productId,
              name: p.name,
              image: Array.isArray(p.image) && p.image.length > 0 ? p.image[0] : "https://via.placeholder.com/300",
              description: p.description,
              dimensions: p.dimensions,
              quantity: p.quantity,
              material: p.material,
              type: 'auction',
            }))
        );
      } catch (err) {
        console.error("Error fetching auction products", err);
      }
    };

    fetchAuctionProducts();
  }, [profile]);

  if (message) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-10 rounded-[2rem] shadow-[0_8px_30px_rgba(224,115,133,0.2)] bg-[#F6EEEE] border border-[#E07385]/20 animate-fadeIn mt-2">
        <div className="relative mb-6">
          <div className="absolute -inset-1 blur-lg bg-[#E07385] opacity-10 rounded-full animate-pulse" />
          <img
            src="https://cdn-icons-png.flaticon.com/512/2922/2922510.png"
            alt="Incomplete Profile"
            className="relative w-36 h-36 animate-bounce-slow z-10"
          />
        </div>

        <h2 className="text-2xl md:text-3xl font-extrabold text-[#921A40] mb-3 tracking-tight">
          Profile Incomplete
        </h2>

        <p className="text-gray-700 max-w-2xl text-base md:text-lg leading-relaxed mb-6">
          We noticed your artist profile is missing some key info. Completing it helps you gain visibility, connect with fans, and showcase your creative journey!
        </p>

        <button
          onClick={() => setActiveTab("edit")}
          className="px-8 py-3 bg-[#E07385] text-white font-semibold text-base md:text-lg rounded-full shadow-lg hover:bg-[#921A40] hover:scale-105 active:scale-95 transition-all duration-300"
        >
          ✨ Complete My Profile
        </button>
      </div>
    );
  }

  if (!profile) return <p className="text-gray-600">Loading profile...</p>;

  const sortedNormalProducts = [...products].sort(
    (a, b) => (b.sellingNumber || 0) - (a.sellingNumber || 0)
  );
  const bestSellingId = sortedNormalProducts[0]?.productId;
  const leastSellingId = sortedNormalProducts[sortedNormalProducts.length - 1]?.productId;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex flex-col md:flex-row gap-6 mb-6 items-start">
        <div className="flex-1">
          <div className="flex items-start gap-4 mb-4">
            <img
              src={profile?.profilePicture || "https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_640.png"}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover border-2 border-[#E07385] shadow-md"
            />
            <div className="mt-3">
              <div className="flex justify-end">
                <div className="flex flex-wrap items-center gap-4">
                  <h1 className="text-2xl font-semibold text-gray-900">
                    {profile.name || "Artist Name"}
                  </h1>

                  <div className="flex items-center gap-2 text-sm text-gray-600 flex-wrap">
                    <div className="flex items-center gap-1 bg-[#F6EEEE] px-3 py-1 rounded-full shadow-sm text-[#921A40]">
                      <Star size={16} weight="fill" className="mt-[2px]" />
                      {Number(profile.averageRating || 0).toFixed(2)}
                      <span className="text-xs text-gray-500">({profile.totalRatings || 0})</span>
                    </div>

                    <div className="flex items-center gap-1 bg-[#F6EEEE] px-3 py-1 rounded-full shadow-sm text-[#921A40]">
                      <ChatCircleDots size={16} weight="fill" className="mt-[2px]" />
                      {profile.totalRatings || 0} ratings
                    </div>

                    <div className="flex items-center gap-1 bg-[#F6EEEE] px-3 py-1 rounded-full shadow-sm text-[#921A40]">
                      <Coins size={16} weight="fill" className="mt-[2px]" />
                      {Number(profile.sales || 0).toLocaleString()} LE
                    </div>

                  </div>
                </div>
              </div>

              <p className="text-base text-[#921A40]">@{profile.username || "username"}</p>
              <p className="text-sm text-gray-500 mt-1">{profile.visitors || 0} visitors during this week</p>

            </div>
          </div>

          <div className="bg-[#F6EEEE] p-6 rounded-lg shadow-md text-xl leading-relaxed mt-10 text-black">
            {profile.biography && profile.biography.length > 250 ? (
              <p className="whitespace-pre-line">
                {showFullBio ? profile.biography : profile.biography.slice(0, 250)}
                <button
                  onClick={() => setShowFullBio(!showFullBio)}
                  className="ml-2 text-[#921A40] hover:underline font-medium text-m inline"
                >
                  {showFullBio ? " Show Less" : "Read More..."}
                </button>
              </p>
            ) : (
              <p className="whitespace-pre-line">
                {profile.biography ||
                  "Add your biography here. This is a placeholder text to give you an idea of how the biography section will look."}
              </p>
            )}
          </div>

        </div>
        {profile.profileVideo && (
          <div className="w-full md:w-1/3 p-2">
            <video
              src={profile.profileVideo}
              controls
              className="w-full h-64 md:h-80 rounded-xl shadow-lg border-4 border-[#E07385] hover:scale-105 transition-transform duration-300 ease-in-out"
            />
          </div>
        )}
      </div>

      <div className="mt-15">
        <div className="flex flex-wrap justify-start gap-10 mb-8">
          <button
            onClick={() => setActiveSection("gallery")}
            className={`px-6 py-3 text-base rounded-full font-semibold transition duration-200 ${activeSection === "gallery"
              ? "bg-[#E07385] text-white shadow-md"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
          >
            Gallery Products
          </button>

          <button
            onClick={() => setActiveSection("auction")}
            className={`px-6 py-3 text-base rounded-full font-semibold transition duration-200 ${activeSection === "auction"
              ? "bg-[#E07385] text-white shadow-md"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
          >
            Auction Products
          </button>

          <button
            onClick={() => setActiveSection("customized")}
            className={`px-6 py-3 text-base rounded-full font-semibold transition duration-200 ${activeSection === "customized"
              ? "bg-[#E07385] text-white shadow-md"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
          >
            Customized Products
          </button>
        </div>


        {activeSection === "gallery" && (
          <div>
            {loadingProducts && <p className="text-center py-8">Loading products...</p>}
            {productsError && <p className="text-red-500 text-center py-4">{productsError}</p>}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.length + auctionProducts.length + customizedProducts.length === 0 && !loadingProducts && (
                <p className="col-span-full text-gray-500 py-8">
                  No products found in your gallery.
                </p>
              )}

              {[...products, ...auctionProducts, ...customizedProducts].map((product, index) => (
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
                    {product.productId === bestSellingId && (
                      <div className="absolute top-3 right-3 bg-[#E07385] text-white text-xs font-bold px-2 py-1 rounded-full z-10">
                        Best Selling
                      </div>
                    )}
                    {products.length > 1 && product.productId === leastSellingId && (
                      <div className="absolute top-3 right-3 bg-black text-[#E07385] text-xs font-bold px-2 py-1 rounded-full z-10">
                        Least Selling
                      </div>
                    )}
                    {product.type === "auction" && (
                      <div className="absolute top-3 right-3 bg-[#E07385]/90 text-white text-xs font-bold px-2 py-1 rounded-full">
                        AUCTION
                      </div>
                    )}
                    {customizedProducts.some(p => p.productId === product.productId) && (
                      <div className="absolute top-3 left-3 bg-yellow-500/90 text-white text-xs font-bold px-2 py-1 rounded-full">
                        CUSTOMIZED
                      </div>
                    )}
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
                    <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                      <h3 className="text-xl font-bold text-[#921A40]">{product.name}</h3>
                      <div className="mt-2 text-white/90 text-sm">
                        <p className="line-clamp-2">{product.description}</p>
                        <div className="flex justify-between mt-2">
                          <span className="font-medium">Qty: {product.quantity}</span>
                          {product.dimensions && (
                            <span>{product.dimensions}</span>
                          )}
                        </div>
                        {product.material && (
                          <p className="mt-1">
                            <span className="font-medium">Material:</span> {product.material}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}


        {activeSection === "auction" && (
          <div>
            {loadingProducts && <p className="text-center py-8">Loading auction products...</p>}
            {productsError && <p className="text-red-500 text-center py-4">{productsError}</p>}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {auctionProducts.length === 0 && !loadingProducts && (
                <p className="col-span-full text-gray-500 py-8">
                  No auction products found.
                </p>
              )}

              {auctionProducts.map((product) => (
                <div
                  key={product._id || product.id}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="aspect-square relative overflow-hidden">
                    <img
                      src={product.image || "https://via.placeholder.com/500"}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                    <div className="absolute top-3 right-3 bg-[#E07385]/90 text-white text-xs font-bold px-2 py-1 rounded-full">
                      AUCTION
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {activeSection === "customized" && (
          <div>
            {loadingProducts && <p className="text-center py-8">Loading customized products...</p>}
            {customizedProducts.length === 0 && !loadingProducts && (
              <p className="col-span-full text-gray-500 py-8">
                No customized products found.
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {customizedProducts.map((product) => (
                <div
                  key={product.productId}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="aspect-square relative overflow-hidden">
                    <img
                      src={product.image?.[0] || "https://via.placeholder.com/300"}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                    <div className="absolute top-3 right-3 bg-yellow-500/90 text-white text-xs font-bold px-2 py-1 rounded-full">
                      CUSTOMIZED
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-[#921A40]">{product.name}</h3>
                    <p className="text-sm text-gray-600">{product.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default GetProfile;