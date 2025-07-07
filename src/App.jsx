import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { WishlistProvider } from './context/WishlistContext';
import { CartProvider }     from './context/CartContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuctionsSection from './Components/AuctionsSection';
import Navbar from './Components/Navbar';
import HeroSection from './Components/HeroSection';
import PopularProducts     from './Components/AvaliableProducts';
import BestSellingProducts from './Components/BestSellingProducts';
import Footer              from './Components/Footer';
import Login               from './Components/Login';
import ArtistProfile       from './pages/ArtistProfile';
import CustomerProfile     from './pages/CustomerProfile';
import CartPage            from './pages/CartPage';
import Shop                from './pages/Shop';
import AdminPage           from './pages/AdminPage';
import Register from './Components/Register';
import ProtectedRoute from './Components/ProtectedRoute';
import ProductDetails from './pages/ProductDetails';
import Artists from './pages/Artists';
import ArtistsSection from './Components/ArtistsSection';
import Auctions from './pages/Auctions';
import ShopByCategory from './Components/ShopByCategory';
import WishlistPage        from './pages/WishlistPage';
import AuctionDetails from './pages/AuctionDetails';
import MyOrders from './pages/MyOrders';
import PaymentPage from './pages/PaymentPage';
import ArtistProfileCustomer from './pages/ArtistProfileCustomer';
import ScrollToTop from './Components/ScrollToTop';
import Following from './Components/Following';
import { Toaster } from 'react-hot-toast';
import SearchResults from './pages/SearchResults';
import VerifyEmail from './pages/VerifyEmail';
import AdminProfile from './Components/AdminProfile';
function LoginRoute() {
  const { user } = useAuth();

  if (!user) {
    return <Login />;
  }
  switch (user.role) {
    case 'artist':
      return <Navigate to="/artist-profile" replace />;
    case 'admin':
      return <Navigate to="/admin" replace />;
    default:
      return <Navigate to="/" replace />;
  }
}
function AppContent() {
  useAuth();
  const location   = useLocation();
  const hideNavbar = location.pathname.startsWith('/admin');

  return (
    <>
      {!hideNavbar && <Navbar />}
      <Routes>
        <Route
          path="/"
          element={
            <>
              <HeroSection />
              <ShopByCategory />
              <PopularProducts />
              <BestSellingProducts />
              <ArtistsSection />
              <AuctionsSection />
              <Footer />
            </>
          }
        />
                <Route
          path="/admin"
          element={
            <ProtectedRoute
              element={<AdminPage />}
              allowedRoles={['admin']}
            />
          }
        />
        <Route
          path="/artist-profile"
          element={
            <ProtectedRoute
              element={<ArtistProfile />}
              allowedRoles={['artist']}
            />
          }
        />
        <Route
          path="/customer-profile"
          element={
            <ProtectedRoute
              element={<CustomerProfile />}
              allowedRoles={['customer']}
            />
          }
        />

        <Route 
          path="/following" 
                    element={
            <ProtectedRoute
          element={<Following />}
          allowedRoles={['customer']}
            />
          }
          />

        <Route 
          path="/cart" 
                    element={
            <ProtectedRoute
          element={<CartPage />}
          allowedRoles={['customer']}
            />
          }
          />



      <Route 
      path="/wishlist" 
      element={
            <ProtectedRoute
          element={<WishlistPage  />}
          allowedRoles={['customer']}
            />
          }
      />



      <Route 
      path="/orders" 
      element={
            <ProtectedRoute
          element={<MyOrders  />}
          allowedRoles={['customer']}
            />
          }
      />


        <Route path="/auction/:id" element={<AuctionDetails />}/>
        <Route path="/auctions" element={<Auctions />}/>
        <Route path="/artists" element={<Artists />}/>
        <Route path="/artist-profile-customer/:id" element={<ArtistProfileCustomer />}/>
        <Route path="/register" element={<Register/>}/>
        <Route path="/shop" element={<Shop />} />
        <Route path="/login" element={<LoginRoute />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route path="/artist/:id" element={<ArtistProfile />} />
        <Route path="/payment/:orderId" element={<PaymentPage />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
         <Route path="/admin/profile" element={<AdminProfile />} />


      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <WishlistProvider>
        <CartProvider>
          <Router>
            <ScrollToTop />
            <AppContent />
            <Toaster position="top-center" reverseOrder={false} />
          </Router>
        </CartProvider>
      </WishlistProvider>
    </AuthProvider>
  );
}
