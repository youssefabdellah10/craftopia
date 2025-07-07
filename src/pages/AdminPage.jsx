import { useState } from "react";
import AdminSidebar from "../Components/AdminSidebar";
import AdminSearchbar from "../Components/AdminSearchbar";
import AdminDashboard from "../Components/AdminDashboard";
import AdminReports from "../Components/AdminReports";
import AdminCategory from "../Components/AdminCategory";
import AddCategory from "../Components/AddCategory";
import AdminAuctionManagement from "./AdminAuctionManagement";
import ReleasePayment from "../Components/ReleasePayment";
import UserManagement from "../Components/UserManagement";
import ProductsManagement from "../Components/ProductsManagement";
import AdminProfile from "../Components/AdminProfile";
const tabOptions = ["Home", "Reports", "Categories", "Add Category", "Auctions", "Payments", "User Management", "Manage Products","Profile"];

const AdminPage = () => {
  const [selected, setSelected] = useState(() => {
    return localStorage.getItem("adminSelectedTab") || "Home";
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredTabs, setFilteredTabs] = useState([]);

  const handleSetSelected = (tab) => {
    setSelected(tab);
    localStorage.setItem("adminSelectedTab", tab);
    setSearchTerm("");
    setFilteredTabs([]);
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    const filtered = tabOptions.filter((tab) =>
      tab.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredTabs(filtered);
  };

  const renderContent = () => {
    switch (selected) {
      case "Home":
        return <AdminDashboard />;
      case "Reports":
        return <AdminReports />;
      case "Categories":
        return <AdminCategory setSelected={handleSetSelected} />;

      case "Add Category":
        return <AddCategory />;
      case "Auctions":
        return <AdminAuctionManagement />;
      case "Payments":
        return <ReleasePayment />;
      case "User Management":
        return <UserManagement />;
      case "Product Management":
        return <ProductsManagement />;
      case "Profile":
        return <AdminProfile />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#FAF9F6] overflow-hidden">
      <AdminSidebar selected={selected} setSelected={handleSetSelected} />
      <div className="flex flex-col items-stretch w-full ml-20 pr-10 overflow-auto h-screen">
        <AdminSearchbar
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          filteredTabs={filteredTabs}
          onTabClick={handleSetSelected}
        />
        {renderContent()}
      </div>
    </div>
  );
};

export default AdminPage;
