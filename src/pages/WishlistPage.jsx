import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import ProductCard from '../Components/ProductCard';
import Footer from '../Components/Footer';

const WishlistPage = () => {
  const { wishlist, removeFromWishlist } = useWishlist();
  const { cartItems, addToCart, incrementItem, decrementItem } = useCart();

  if (wishlist.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center min-h-[75vh] px-4 text-center">
          <img
            src="/assets/wishlist.png"
            alt="Empty wishlist"
            className="w-64 h-64 mb-6 object-contain"
          />
          <h1 className="text-2xl font-semibold text-gray-600">
            Your wishlist is currently empty.
          </h1>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-[#FAF9F6] py-12 px-4 md:px-10 mt-10">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-[#333] mb-20 text-center">Your Wishlist</h1>
          <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(280px,1fr))]">
            {wishlist.map((product) => {
              const itemInCart = cartItems.find((item) => item.id === product.id);
              const isInCart = !!itemInCart;
              const quantity = itemInCart?.quantity || 0;

              return (
                <ProductCard
                  key={product.id}
                  product={{
                    ...product,
                    image: Array.isArray(product.image)
                      ? product.image
                      : product.image
                        ? [product.image]
                        : ['/placeholder.jpg'],
                    category: typeof product.category === 'string'
                      ? product.category
                      : product.category?.name,
                    artist: typeof product.artist === 'string'
                      ? product.artist
                      : product.artist?.username || 'Unknown',
                    averageRating: parseFloat(product.averageRating) || 0,
                    totalReviews: product.totalReviews || 0,
                  }}

                  isFavorite={true}
                  onToggleFavorite={() => removeFromWishlist(product.id)}
                  isInCart={isInCart}
                  quantity={quantity}
                  onAddToCart={addToCart}
                  onIncrement={incrementItem}
                  onDecrement={decrementItem}
                />
              );
            })}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default WishlistPage;
