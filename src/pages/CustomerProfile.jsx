import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaUser, FaSignOutAlt, FaHeart } from "react-icons/fa";
import Profile from "../Components/Profile";
import CompleteProfile from "../Components/CompleteProfile";
import Wishlist from "../Components/Wishlist";
import Footer from "../Components/Footer";
import RequestCustomization from "../Components/RequestCustomization";
import CompareProducts from "../Components/CompareProducts";
import { MdCompare } from "react-icons/md";
import MyOrders from "./MyOrders";
import { FiPackage } from "react-icons/fi";

const CustomerProfile = ({ setIsLoggedIn }) => {
    const location = useLocation();
    const navigate = useNavigate();
      const [activeTab, setActiveTab] = useState(() => {
        return localStorage.getItem("customerActiveTab") || "profile";
    });

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
        navigate("/");
        }
    }, []);
    useEffect(() => {
        if (location.state?.tab) {
            setActiveTab(location.state.tab);
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location]);

    useEffect(() => {
        localStorage.setItem("customerActiveTab", activeTab);
    }, [activeTab]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("customerActiveTab");
        setIsLoggedIn(false);
        navigate("/login");
    };

     return (
    <div className="flex flex-col min-h-screen bg-[#FAF9F6]">
      <div className="flex w-full flex-grow">
        <div className="w-64 bg-white p-4 shadow-md ml-30 mt-20 rounded-2xl h-[60vh]">
          <nav>
            <ul className="space-y-3">
              <li
                onClick={() => setActiveTab("profile")}
                className={`hover:bg-gray-100 p-2 rounded cursor-pointer flex items-center gap-2 ${activeTab === "profile" ? "bg-gray-200 font-semibold" : ""}`}
              >
                <FaUser className="text-black" />
                My Profile
              </li>

              <li
                onClick={() => setActiveTab("wishlist")}
                className={`hover:bg-gray-100 p-2 rounded cursor-pointer flex items-center gap-2 ${activeTab === "wishlist" ? "bg-gray-200 font-semibold" : ""}`}
              >
                <FaHeart className="text-black" />
                Wishlist
              </li>

              <li
                onClick={() => navigate("/orders")}
                className="hover:bg-gray-100 p-2 rounded cursor-pointer flex items-center gap-2"
              >
                <FiPackage className="text-black" />
                My Orders
              </li>

              <li
                onClick={() => setActiveTab("compare")}
                className={`hover:bg-gray-100 p-2 rounded cursor-pointer flex items-center gap-2 ${activeTab === "compare" ? "bg-gray-200 font-semibold" : ""}`}
              >
                <MdCompare className="text-black" />
                Compare Products
              </li>

              <li
                onClick={() => setActiveTab("customization")}
                className={`hover:bg-gray-100 p-2 rounded cursor-pointer flex items-center gap-2 ${activeTab === "customization" ? "bg-gray-200 font-semibold" : ""}`}
              >
                Custom products
              </li>
            </ul>
          </nav>
        </div>

        <div className="flex-1 p-8 mt-20">
          <div className="max-w-6xl mx-auto bg-[#FAF9F6] rounded-lg shadow-md p-6 -mt-8">
            {activeTab === "profile" && <Profile setActiveTab={setActiveTab} />}
            {activeTab === "edit" && <CompleteProfile />}
            {activeTab === "wishlist" && <Wishlist />}
            {activeTab === "orders" && <MyOrders />}
            {activeTab === "compare" && <CompareProducts />}
            {activeTab === "customization" && <RequestCustomization />}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CustomerProfile;