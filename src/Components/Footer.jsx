import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Footer = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleAccountClick = () => {
    if (!user) {
      navigate("/login");
    } else if (user.role === "customer") {
      navigate("/customer-profile");
    } else if (user.role === "artist") {
      navigate("/artist-profile");
    }
  };

  return (
    <footer className="bg-black text-white py-12 mt-20">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12">
        {/* Branding + Subscribe */}
        <div>
          <h2 className="text-2xl font-bold text-[#E07385] mb-3">Craftopia</h2>
          <p className="text-sm mb-2">Subscribe & get 10% off your first order</p>
          <div className="flex items-center bg-[#111] border border-gray-600 rounded-lg overflow-hidden max-w-xs">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-3 py-2 text-sm bg-transparent text-white placeholder-gray-400 focus:outline-none"
            />
            <button className="bg-[#E07385] hover:bg-[#c1586c] transition-colors px-4 py-2 text-sm font-medium">
              ➤
            </button>
          </div>
        </div>

        {/* Support */}
        <div>
          <h3 className="text-lg font-semibold text-[#E07385] mb-4">Support</h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>Email: <a href="mailto:craftopia@gmail.com" className="hover:text-white">craftopia@gmail.com</a></li>
            <li>Phone: <span className="hover:text-white">+88015-88888-9999</span></li>
          </ul>
        </div>

        {/* Account */}
        <div>
          <h3 className="text-lg font-semibold text-[#E07385] mb-4">Account</h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li
              className="cursor-pointer hover:text-white"
              onClick={handleAccountClick}
            >
              My Account
            </li>
            <li><Link to="/login" className="hover:text-white">Login / Register</Link></li>
            <li><Link to="/cart" className="hover:text-white">Cart</Link></li>
            <li><Link to="/wishlist" className="hover:text-white">Wishlist</Link></li>
            <li><Link to="/shop" className="hover:text-white">Shop</Link></li>
          </ul>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-lg font-semibold text-[#E07385] mb-4">Quick Links</h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li><Link to="/privacy-policy" className="hover:text-white">Privacy Policy</Link></li>
            <li><Link to="/terms" className="hover:text-white">Terms of Use</Link></li>
            <li><Link to="/faq" className="hover:text-white">FAQ</Link></li>
            <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-700 mt-12 pt-6 text-center text-xs text-gray-400">
        © 2025 Craftopia. All rights reserved. Made with ❤️ by artisans everywhere.
      </div>
    </footer>
  );
};

export default Footer;
