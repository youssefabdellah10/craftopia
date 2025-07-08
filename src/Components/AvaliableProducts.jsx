import { useState, useEffect, useRef } from "react";
import { FiChevronRight, FiChevronLeft } from "react-icons/fi";
import axios from "axios";
import { motion } from "framer-motion";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import ProductCard from "./ProductCard";
import { useNavigate } from "react-router-dom";

const AvaliableProducts = () => {
  const [products, setProducts] = useState([]);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollRef = useRef(null);
  const navigate = useNavigate();

  const { wishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { cartItems, addToCart, incrementQuantity, decrementQuantity } = useCart();

  useEffect(() => {
    axios
      .get("http://localhost:3000/product/get", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      .then((res) => {
        const fetched = res.data.products || [];
        const formatted = fetched
          .filter((p) => p.quantity > 0 && p.type === "normal")
          .map((p) => ({
            id: p.productId,
            name: p.name,
            price: p.price,
            image: Array.isArray(p.image) ? p.image : p.image ? [p.image] : ["/placeholder.jpg"],
            description: p.description || "No description available.",
            dimensions: p.dimensions || "Not specified",
            material: p.material || "Not specified",
            category: p.category?.name || "Uncategorized",
            artist: p.artist?.name || "Unknown",
            inStock: p.quantity > 0,
            averageRating: parseFloat(p.averageRating) || 0,
            totalReviews: p.totalReviews || 0,
            quantity: p.quantity,
            sellingNumber: p.sellingNumber || 0,
            type: p.type,
          }));
        setProducts(formatted);
      })
      .catch((err) => console.error("Failed to fetch products:", err));
  }, []);

  const toggleWishlist = (product) => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    const exists = wishlist.find((item) => item.id === product.id);
    exists ? removeFromWishlist(product.id) : addToWishlist(product);
  };

  const updateScrollButtons = () => {
    const container = scrollRef.current;
    if (!container) return;
    const { scrollLeft, scrollWidth, clientWidth } = container;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);
  };

  const handleScroll = (direction) => {
    const container = scrollRef.current;
    if (!container) return;
    const cardWidth = container.firstChild?.offsetWidth || 270;
    container.scrollBy({
      left: direction === "right" ? cardWidth + 24 : -cardWidth - 24,
      behavior: "smooth",
    });
    setTimeout(updateScrollButtons, 300);
  };

  useEffect(() => {
    updateScrollButtons();
    const container = scrollRef.current;
    container?.addEventListener("scroll", updateScrollButtons);
    return () => container?.removeEventListener("scroll", updateScrollButtons);
  }, [products]);

  return (
    <section className="py-20 bg-cream overflow-hidden">
      <div className="container mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-black/90 mb-4">
            Shop Our Available Products
          </h2>
          <p className="text-xl text-burgundy/80 max-w-2xl mx-auto">
            Browse unique, handmade items crafted by talented artists
          </p>
        </motion.div>

        {canScrollLeft && (
          <button
            onClick={() => handleScroll("left")}
            className="absolute -left-6 top-1/2 -translate-y-1/2 z-20 bg-white border border-gray-200 shadow-md rounded-lg p-2 hover:bg-[#fbe9ed] transition"
          >
            <FiChevronLeft className="text-[#921A40] text-2xl" />
          </button>
        )}
        {canScrollRight && (
          <button
            onClick={() => handleScroll("right")}
            className="absolute -right-6 top-1/2 -translate-y-1/2 z-20 bg-white border border-gray-200 shadow-md rounded-lg p-2 hover:bg-[#fbe9ed] transition"
          >
            <FiChevronRight className="text-[#921A40] text-2xl" />
          </button>
        )}

        <motion.div
          ref={scrollRef}
          className="flex gap-8 overflow-x-auto px-5 py-5 scrollbar-hide snap-x snap-mandatory"
          style={{
            scrollBehavior: "smooth",
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          {products.map((product, index) => {
            const isFavorite = wishlist.some((item) => item.id === product.id);
            const inCart = cartItems.find((item) => item.id === product.id);
            const quantity = inCart?.cartQuantity || 0;
            const maxStock = product.quantity - (product.sellingNumber || 0);
            const maxReached = quantity >= maxStock;

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ scale: 1.05, rotateY: 5 }}
                viewport={{ once: true }}
                className="group cursor-pointer snap-center w-[300px] md:w-[330px] flex-shrink-0"
              >
                <ProductCard
                  product={product}
                  isFavorite={isFavorite}
                  onToggleFavorite={() => toggleWishlist(product)}
                  isInCart={!!inCart}
                  quantity={quantity}
                  maxReached={maxReached}
                  onAddToCart={() => addToCart(product, navigate)}
                  onIncrement={() => {
                    if (inCart) incrementQuantity(inCart);
                  }}
                  onDecrement={() => {
                    if (inCart && quantity > 0) decrementQuantity(inCart);
                  }}
                />
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

export default AvaliableProducts;
