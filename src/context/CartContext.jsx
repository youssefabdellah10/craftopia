import { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (user && storedToken) {
      setToken(storedToken);
    }
  }, [user]);
  useEffect(() => {
    if (token) {
      fetchCart(token);
    }
  }, [token]);

  const getAuthHeader = () => {
    if (!token) return null;
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  const fetchCart = async (authToken = token) => {
    try {
      setIsLoading(true);
      const res = await axios.get("http://localhost:3000/mycart", {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const items = res.data.cartItems.map((item) => {
        const product = item.product;
        return {
          id: product.productId,
          name: product.name,
          price: product.price,
          image: product.image,
          category: product.category?.name || "Unknown",
          artist: product.artist?.name || "Unknown",
          description: product.description,
          dimensions: product.dimensions,
          material: product.material,
          cartQuantity: item.quantity,
          stockQuantity: product.quantity - product.sellingNumber,
          inStock: product.quantity > 0,
          averageRating: product.averageRating || 0,
          totalReviews: product.totalReviews || 0,
        };
      });

      setCartItems(items);
    } catch (error) {
      console.error("❌ Failed to fetch cart:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = async (product) => {
    const authHeader = getAuthHeader();
    if (!authHeader) return;

    const existing = cartItems.find((item) => item.id === product.id);
    const currentCartQty = existing?.cartQuantity || 0;
    const maxQty = existing?.stockQuantity || product.quantity;

    if (currentCartQty >= maxQty) return;

    try {
      console.log("🛒 Adding product to cart:", product);
      await axios.post(
        `http://localhost:3000/mycart/add/${product.id}`,
        {},
        authHeader
      );

      await fetchCart();
      console.log("✅ Product added to cart successfully");
    } catch (err) {
      console.error("❌ Add to cart failed:", err);
      throw err;
    }
  };

  const incrementQuantity = async (product) => {
    const id = product.id;
    const authHeader = getAuthHeader();
    if (!authHeader) return;

    try {
      const res = await axios.post(
        `http://localhost:3000/mycart/increment/${id}`,
        {},
        authHeader
      );

      const updatedQty = res.data.cartItem.quantity;

      setCartItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, cartQuantity: updatedQty } : item
        )
      );
    } catch (err) {
      console.error("❌ Increment failed:", err.response?.data || err.message);
    }
  };

  const decrementQuantity = async (product) => {
    const id = product.id;
    const authHeader = getAuthHeader();
    if (!authHeader) return;

    try {
      const res = await axios.post(
        `http://localhost:3000/mycart/decrement/${id}`,
        {},
        authHeader
      );

      if (res.data.message === "Cart item removed completely") {
        setCartItems((prev) => prev.filter((item) => item.id !== id));
      } else {
        const updatedQty = res.data.cartItem.quantity;
        setCartItems((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, cartQuantity: updatedQty } : item
          )
        );
      }
    } catch (err) {
      console.error("❌ Decrement failed:", err.response?.data || err.message);
    }
  };

  const removeFromCart = async (id) => {
    const authHeader = getAuthHeader();
    if (!authHeader) return;

    try {
      await axios.delete(
        `http://localhost:3000/mycart/remove/${id}`,
        authHeader
      );
      setCartItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error("❌ Remove from cart failed:", err);
    }
  };

  const clearCart = async () => {
    const authHeader = getAuthHeader();
    if (!authHeader) return;

    try {
      await axios.delete("http://localhost:3000/mycart/clear", authHeader);
      setCartItems([]);
    } catch (err) {
      console.error("❌ Clear cart failed:", err);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        incrementQuantity,
        decrementQuantity,
        clearCart,
        fetchCart,
        isLoading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
