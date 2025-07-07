import { useEffect } from 'react';
import { useCart } from '../context/CartContext';
import CartItem from '../Components/CartItem';
import CartOverview from '../Components/CartOverview';
import Footer from '../Components/Footer';

const CartPage = () => {
  const {
    cartItems,
    removeFromCart,
    clearCart,
    incrementQuantity,
    decrementQuantity,
    fetchCart,
    isLoading,
  } = useCart();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) fetchCart(token);
  }, []);

  const isCartEmpty = cartItems.length === 0;

  if (isLoading) {
    return <div className="text-center py-20 text-lg text-gray-600">Loading cart...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF9F6]">
      <div className="w-[90%] mx-auto flex flex-col lg:flex-row gap-8 py-12">
        {isCartEmpty ? (
          <div className="flex flex-col items-center justify-center py-20 w-full">
            <img
              src="/assets/cart.png"
              alt="Empty Cart"
              className="w-85 h-60 mb-4"
            />
            <h2 className="text-xl font-semibold text-gray-700">Your cart is empty</h2>
            <p className="text-gray-500 mt-1">Looks like you haven't added anything yet.</p>
          </div>
        ) : (
          <>
            <div className="lg:w-[60%]">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Cart Items</h1>
                <button
                  onClick={clearCart}
                  className="text-sm text-red-800 hover:text-red-900 font-medium bg-red-100 hover:bg-red-200 px-4 py-1.5 rounded-md transition"
                >
                  Clear Cart
                </button>
              </div>

              <div className="space-y-4">
                {cartItems.map(item => (
                  <CartItem
                    key={item.id}
                    item={item}
                    onQuantityChange={(type) =>
                      type === "inc"
                        ? incrementQuantity(item)
                        : decrementQuantity(item)
                    }
                    onRemove={() => removeFromCart(item.id)}
                  />
                ))}
              </div>
            </div>

            <div className="lg:w-[40%]">
              <CartOverview cartItems={cartItems} />
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default CartPage;
