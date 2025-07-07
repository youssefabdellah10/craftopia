import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaEdit, FaSignOutAlt, FaPlus } from "react-icons/fa";
import { BarChart2 } from "lucide-react";
import GetProfile from "../Components/GetProfile";
import EditProfile from "../Components/EditProfile";
import AddProduct from "../Components/AddProduct";
import Footer from "../Components/Footer";
import ReviewRequests from "../Components/ReviewRequests";
import { Gavel } from "lucide-react";
import AuctionRequest from "../Components/AuctionRequest";
import RequestCategory from "../Components/RequestCategory";
import Messages from "../Components/Messages";
import SalesHistory from "../Components/SalesHistory";
import { useEffect } from "react";

const ArtistProfile = ({ setIsLoggedIn }) => {
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("activeTab") || "profile";
  });
  const [selectedMessageId, setSelectedMessageId] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
  localStorage.setItem("activeTab", activeTab);
}, [activeTab]);
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("activeTab");
    setIsLoggedIn(false);
    navigate("/login");
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF9F6]">
      <div className="flex w-full flex-grow">
        {/* Sidebar */}
        <div className="w-64 bg-white p-4 shadow-md ml-30 mt-20 rounded-2xl h-[60vh]">
          <nav>
            <ul className="space-y-3">
              <li onClick={() => setActiveTab("profile")} className={`hover:bg-gray-100 p-2 rounded cursor-pointer flex items-center gap-2 ${activeTab === "profile" ? "bg-gray-200 font-semibold" : ""}`}>
                <FaUser className="text-black" /> My Profile
              </li>
              <li onClick={() => setActiveTab("edit")} className={`hover:bg-gray-100 p-2 rounded cursor-pointer flex items-center gap-2 ${activeTab === "edit" ? "bg-gray-200 font-semibold" : ""}`}>
                <FaEdit className="text-black" /> Update
              </li>
              <li onClick={() => setActiveTab("addproduct")} className={`hover:bg-gray-100 p-2 rounded cursor-pointer flex items-center gap-2 ${activeTab === "addproduct" ? "bg-gray-200 font-semibold" : ""}`}>
                <FaPlus className="text-black" /> Add Product
              </li>
              <li onClick={() => setActiveTab("review")} className={`hover:bg-gray-100 p-2 rounded cursor-pointer flex items-center gap-2 ${activeTab === "review" ? "bg-gray-200 font-semibold" : ""}`}>
                📋 View Requests
              </li>
              <li onClick={() => setActiveTab("auction")} className={`hover:bg-gray-100 p-2 rounded cursor-pointer flex items-center gap-2 ${activeTab === "auction" ? "bg-gray-200 font-semibold" : ""}`}>
                <Gavel className="h-4 w-4" /> Request Auction
              </li>
              <li onClick={() => setActiveTab("requestcategory")} className={`hover:bg-gray-100 p-2 rounded cursor-pointer flex items-center gap-2 ${activeTab === "requestcategory" ? "bg-gray-200 font-semibold" : ""}`}>
                📩 Request Category
              </li>
              <li
                onClick={() => setActiveTab("saleshistory")}
                className={`hover:bg-gray-100 p-2 rounded cursor-pointer flex items-center gap-2 ${activeTab === "saleshistory" ? "bg-gray-200 font-semibold" : ""
                  }`}
              >
                <BarChart2 className="h-4 w-4 text-black" /> Sales History
              </li>
            </ul>
          </nav>
        </div>
        <div className="flex-1 p-8 mt-20">
          <div className="max-w-6xl mx-auto bg-cream rounded-lg shadow-md p-6 -mt-8">
            {activeTab === "profile" && <GetProfile setActiveTab={setActiveTab} />}
            {activeTab === "edit" && <EditProfile />}
            {activeTab === "addproduct" && <AddProduct />}
            {activeTab === "review" && <ReviewRequests onMessageClick={setSelectedMessageId} />}
            {activeTab === "auction" && <AuctionRequest />}
            {activeTab === "requestcategory" && <RequestCategory />}
            {activeTab === "saleshistory" && <SalesHistory />}
          </div>
          {selectedMessageId && (
            <div className="mt-8 max-w-4xl mx-auto">
              <Messages responseId={selectedMessageId} onClose={() => setSelectedMessageId(null)} />
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ArtistProfile;
