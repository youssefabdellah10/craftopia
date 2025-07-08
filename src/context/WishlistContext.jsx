import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState([]);
  const [token, setToken] = useState(localStorage.getItem("token"));

  useEffect(() => {
    const interval = setInterval(() => {
      const newToken = localStorage.getItem("token");
      if (newToken !== token) {
        setToken(newToken);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchWishlist(token);
    } else {
      setWishlist([]);
    }
  }, [token]);

  const fetchWishlist = async (authToken) => {
  try {
    const res = await axios.get("http://localhost:3000/wishlist/mywishlist", {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    const items = res.data.wishlistItems.map((item) => {
      const product = item.product;
      return {
        ...product,
        id: product.productId,
        category: product.category || { name: "Unknown" },
        artist: product.artist || { name: "Unknown" },
        inStock: product.quantity > 0,
        averageRating: product.averageRating || 0,
        totalReviews: product.totalReviews || 0,
      };
    });

    setWishlist(items);
  } catch (error) {
    console.error("Failed to fetch wishlist:", error);
  }
};


  const addToWishlist = async (product) => {
  try {
    await axios.post(`http://localhost:3000/wishlist/add/${product.id}`, null, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    const normalizedProduct = {
      ...product,
      id: product.productId || product.id,
      category: product.category || { name: "Unknown" },
      artist: product.artist || { name: "Unknown" },
      inStock: product.quantity > 0,
      averageRating: product.averageRating || 0,
      totalReviews: product.totalReviews || 0,
    };

    setWishlist((prev) => [...prev, normalizedProduct]);
  } catch (error) {
    if (error.response?.data?.message === "Product already in wishlist") {
      console.warn("Already in wishlist.");
    } else {
      console.error("Failed to add to wishlist:", error);
    }
  }
};


  const removeFromWishlist = async (productId) => {
  try {
    const res = await axios.delete(`http://localhost:3000/wishlist/remove/${productId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (res.status === 200) {
      setWishlist((prev) => prev.filter((item) => item.id !== productId));
    } else {
      console.warn("Unexpected response when removing from wishlist:", res);
    }
  } catch (error) {
    console.error("Failed to remove from wishlist:", error);
  }
};

  return (
    <WishlistContext.Provider
      value={{ wishlist, addToWishlist, removeFromWishlist }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
