import { useState, useEffect, useMemo } from "react";
import { Star, Package, Ruler, Palette } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";

const ProductInfo = ({ product }) => {
  const {
    cartItems,
    addToCart,
    incrementQuantity,
    decrementQuantity,
  } = useCart();

  const cartItem = cartItems.find((item) => item.id === product.id);
  const [quantity, setQuantity] = useState(cartItem?.cartQuantity || 0);
  const [reviewsCount, setReviewsCount] = useState(product.totalReviews || 0);
  const [selectedImage, setSelectedImage] = useState(null);
  const navigate = useNavigate();

  const isAvailable =
    typeof product.inStock === "boolean"
      ? product.inStock
      : Number(product.quantity ?? 0) > 0;

  useEffect(() => {
    setQuantity(cartItem?.cartQuantity || 0);
  }, [cartItem]);

  useEffect(() => {
    setReviewsCount(product.totalReviews || 0);
  }, [product.totalReviews]);

  const handleAddToCart = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    setQuantity(1);
    addToCart(product);
  };

  const handleIncrease = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    incrementQuantity(product);
  };

  const handleDecrease = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    decrementQuantity(product);
  };

  const productImages = useMemo(() => {
    if (Array.isArray(product.image)) return product.image;
    if (typeof product.image === "string" && product.image.trim() !== "")
      return [product.image];
    return ["/placeholder.jpg"];
  }, [product.image]);

  useEffect(() => {
    if (productImages.length) setSelectedImage(productImages[0]);
  }, [productImages]);

  const renderStars = (rating) =>
    [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < Math.floor(rating) ? "text-yellow-400 fill-current" : "text-gray-300"
          }`}
      />
    ));

  const maxQty = Math.max(
    0,
    Number(product.quantity || 0) - Number(product.sellingNumber || 0)
  );

  const isMaxReached = !isNaN(maxQty) && quantity >= maxQty;

  const handleArtistClick = async () => {
    try {
      console.log("Fetching artist profile...");
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      let artistId = null;

      if (product.artist && typeof product.artist === "object") {
        artistId = product.artist.id || product.artist.artistId;
      } else if (typeof product.artist === "string") {
        const resName = await fetch(
          `http://localhost:3000/artist/getbyname/${encodeURIComponent(product.artist)}`,
          { headers }
        );
        if (!resName.ok) {
          throw new Error("Failed to find artist by name");
        }
        const data = await resName.json();
        artistId = data.artist.artistId;
      }

      if (!artistId) {
        throw new Error("Artist ID not found");
      }
      const res = await fetch(`http://localhost:3000/artist/getprofile/${artistId}`, {
        headers,
      });
      if (!res.ok) {
        throw new Error("Failed to fetch artist profile");
      }

      const artistData = await res.json();
      navigate(`/artist-profile-customer/${artistId}`, {
        state: { artist: artistData },
      });
    } catch (err) {
      console.error(err.message);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-12">
      <div className="space-y-4">
        <div className="aspect-square rounded-2xl overflow-hidden shadow-lg">
          <img
            src={selectedImage}
            alt={product.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>

        <div className="flex gap-3 mt-2">
          {productImages.map((img, idx) => (
            <img
              key={idx}
              src={img}
              alt={`Thumbnail ${idx + 1}`}
              onClick={() => setSelectedImage(img)}
              className={`w-20 h-20 object-cover rounded-lg border cursor-pointer transition-transform duration-200 ${selectedImage === img ? "ring-2 ring-[#E07385]" : "hover:scale-105"
                }`}
            />
          ))}
        </div>
      </div>

      <div className="space-y-5">
        <div className="space-y-1">
          <p className="text-sm font-semibold uppercase text-[#e07385] tracking-wide">
            {typeof product.category === "string"
              ? product.category
              : product.category?.name || "Handmade"}
          </p>

          <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>

          <p className="text-sm text-gray-500">
            by{" "}
            {product.artist && typeof product.artist === "object" ? (
              <button
                onClick={handleArtistClick}
                className="font-medium text-[#E07385] hover:underline"
              >
                {product.artist.username || product.artist.name || "Unknown Artist"}
              </button>
            ) : (
              <button
                onClick={handleArtistClick}
                className="font-medium text-[#E07385] hover:underline focus:outline-none"
              >
                {product.artist?.username ||
                  (typeof product.artist === "string"
                    ? product.artist
                    : product.artist?.name) ||
                  "Unknown Artist"}
              </button>

            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {renderStars(product.rating || 0)}
          <span className="font-medium text-gray-800 text-sm">
            {Number(product.rating || 0).toFixed(1)} ({reviewsCount}{" "}
            {reviewsCount === 1 ? "review" : "reviews"})
          </span>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
          <span className="text-3xl font-bold text-[#E07385]">{product.price} LE</span>

          <div className="flex items-center gap-2">
            <Package className={`w-5 h-5 ${isAvailable ? "text-green-600" : "text-red-600"}`} />
            <span className={`font-medium ${isAvailable ? "text-green-600" : "text-red-600"}`}>
              {isAvailable
                ? `In Stock`
                : "Out of Stock"}
            </span>
          </div>
        </div>

        <div className="bg-[#f3e1e4] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
          <p className="text-gray-700 leading-relaxed">
            {product.description || "No description available."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border p-4 rounded-xl bg-white space-y-2">
            <div className="flex items-center gap-2 font-semibold text-gray-800 mb-2">
              <Ruler className="w-4 h-4 text-[#E07385]" />
              Dimensions
            </div>
            <p className="text-sm text-gray-700">
              {product.dimensions?.trim() && product.dimensions !== "null"
                ? product.dimensions
                : "Not specified"}
            </p>
          </div>

          <div className="border p-4 rounded-xl bg-white space-y-2">
            <div className="flex items-center gap-2 font-semibold text-gray-800 mb-2">
              <Palette className="w-4 h-4 text-[#E07385]" />
              Material
            </div>
            <p className="text-sm text-gray-700">
              {product.material?.trim() && product.material !== "null"
                ? product.material
                : "Not specified"}
            </p>
          </div>
        </div>

        <div className="flex justify-center sm:justify-start mt-6">
          {maxQty === 0 ? (
            <div className="w-full sm:w-1/2 bg-gray-300 text-gray-600 font-semibold py-3 px-6 rounded-full text-center shadow-inner cursor-not-allowed">
              Sold Out
            </div>
          ) : quantity > 0 ? (
            <div className="flex items-center border rounded-full overflow-hidden w-full sm:w-1/2">
              <button
                onClick={handleDecrease}
                className="w-1/3 py-2 bg-[#fce7ea] text-[#E07385] font-bold hover:bg-[#f9d8e0] transition"
              >
                −
              </button>
              <span className="w-1/3 text-center py-2 font-medium text-gray-800 bg-white">
                {quantity}
              </span>
              <button
                onClick={handleIncrease}
                disabled={isMaxReached}
                className={`w-1/3 py-2 text-[#E07385] font-bold transition ${isMaxReached
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-[#fce7ea] hover:bg-[#f9d8e0]"
                  }`}
              >
                +
              </button>
            </div>
          ) : (
            <button
              onClick={handleAddToCart}
              className="w-full sm:w-1/2 bg-[#E07385] hover:bg-[#cf5e72] text-white font-semibold py-3 px-6 rounded-full shadow-lg transition-all duration-200 active:scale-95"
            >
              Add to Cart
            </button>
          )}

        </div>
      </div>
    </div>
  );
};

export default ProductInfo;
