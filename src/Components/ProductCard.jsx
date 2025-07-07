import { useEffect, useState } from "react";
import { Heart, Star, Minus, Plus, PoundSterling } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

const ProductCard = ({ product, onToggleFavorite }) => {
  const navigate = useNavigate();
  const [showControls, setShowControls] = useState(false);
  const [timerId, setTimerId] = useState(null);

  const {
    cartItems,
    addToCart,
    incrementQuantity,
    decrementQuantity,
  } = useCart();
  const [quantity, setQuantity] = useState(0);
  const [isInCart, setIsInCart] = useState(false);
  useEffect(() => {
    const item = cartItems.find((item) => item.id === product.id);
    setIsInCart(!!item);
    setQuantity(item?.cartQuantity || 0);
  }, [cartItems, product.id]);

  const maxStock = product.quantity - (product.sellingNumber || 0);
const maxReached = quantity >= maxStock;

  const mainImage =
    Array.isArray(product.image) && product.image.length > 0
      ? product.image[0]
      : product.image || "/placeholder.jpg";

  const handleCardClick = () => {
    navigate(`/product/${product.id}`, { state: { product } });
  };

  useEffect(() => {
    if (isInCart && quantity > 0) {
      setShowControls(true);
      if (timerId) clearTimeout(timerId);
      const id = setTimeout(() => setShowControls(false), 3000);
      setTimerId(id);
      return () => clearTimeout(id);
    }
  }, [quantity]);

  const handleBadgeClick = (e) => {
    e.stopPropagation();
    clearTimeout(timerId);
    setShowControls(true);
  };

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    await addToCart(product);
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative bg-white shadow-md hover:shadow-lg transition-all duration-500 hover:-translate-y-1 rounded-2xl w-full max-w-[660px] mx-auto cursor-pointer"
    >
      <div className="relative overflow-hidden rounded-t-2xl bg-white">
        <div className="aspect-[4/3] w-full overflow-hidden rounded-t-2xl">
          <img
            src={mainImage}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>

        {!product.inStock && (
          <div className="absolute top-6 left-6 bg-gray-800 text-white text-xs font-semibold px-2 py-1 rounded shadow">
            Sold Out
          </div>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite?.(product);
          }}
          className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-2.5 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:scale-110 shadow"
          aria-label="Toggle wishlist"
        >
          <Heart
            className={`h-4 w-4 transition-colors duration-200 ${
              product.isFavorite
                ? "fill-[#E07385] text-[#E07385]"
                : "text-gray-400 hover:text-[#E07385]"
            }`}
          />
        </button>
      </div>

      <div className="pt-2 pb-5 px-4">
        <div className="mb-1">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            {product.category || "Handmade"}
          </span>
        </div>

        <div className="mb-3">
          <h3 className="font-bold text-lg text-gray-900 group-hover:text-[#E07385] transition-colors duration-200 line-clamp-1">
            {product.name}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            by{" "}
            <span className="font-medium">
              {product.artist?.username || product.artist || "Unknown"}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-[#E07385] text-[#E07385]" />
            <span className="text-sm font-semibold text-gray-900">
              {Number(product.averageRating || 0).toFixed(1)}
            </span>
          </div>
          <span className="text-sm text-gray-500">
            ({product.totalReviews || 0} reviews)
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-x-2">
            <span className="text-xl font-bold text-gray-900 flex items-center gap-x-1">
              <PoundSterling className="h-4 w-4 inline-block" />
              {product.price}
            </span>
            {product.originalPrice && (
              <span className="text-sm text-gray-400 line-through flex items-center gap-x-1">
                <PoundSterling className="h-4 w-4 inline-block" />
                {product.originalPrice}
              </span>
            )}
          </div>

          {product.inStock ? (
            isInCart ? (
              showControls ? (
                <div
                  className="flex items-center gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => decrementQuantity(product)}
                    className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-full transition"
                  >
                    <Minus className="w-4 h-4 text-gray-600" />
                  </button>
                  <span className="text-sm font-semibold text-gray-800">
                    {quantity}
                  </span>
                  <button
                    onClick={() => !maxReached && incrementQuantity(product)}
                    disabled={maxReached}
                    title={maxReached ? "Maximum stock reached" : "Increase quantity"}
                    className={`p-1.5 rounded-full transition ${
                      maxReached
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleBadgeClick}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-[#E07385] text-white font-semibold text-sm transition hover:scale-105"
                >
                  {quantity}
                </button>
              )
            ) : (
              <button
                onClick={handleAddToCart}
                className="text-sm font-medium rounded-full px-4 py-1 bg-[#E07385] text-white hover:bg-[#d15e72] transition"
              >
                Add to Cart
              </button>
            )
          ) : (
            <div className="text-sm bg-gray-300 text-gray-500 px-4 py-1 rounded-full cursor-not-allowed">
              Sold Out
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
