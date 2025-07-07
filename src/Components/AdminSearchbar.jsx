import { FaSearch, FaUser } from "react-icons/fa";

const AdminSearchbar = ({ searchTerm, onSearchChange, filteredTabs, onTabClick }) => {
  const handleAdminClick = () => {
    onTabClick("Profile");
  };

  return (
    <div className="w-full relative mt-5 px-6">
      <div className="absolute top-0 right-6 mt-1">
        <div
          className="flex items-center gap-2 cursor-pointer group"
          onClick={handleAdminClick}
        >
          <FaUser className="text-[#000000] text-2xl transition group-hover:text-[#D27C7D]" />
          <span className="text-base font-medium text-[#000000] transition group-hover:text-[#D27C7D]">
            @admin
          </span>
        </div>
      </div>

      <div className="w-4/5">
        <div className="relative">
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full p-1.5 pl-10 bg-white border border-[#A36361] rounded-md focus:outline-none focus:ring-1 focus:ring-[#A36361]"
          />
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#A36361]" />

          {searchTerm && filteredTabs.length > 0 && (
            <ul className="absolute z-10 bg-white border border-[#A36361] rounded-md mt-1 w-full max-h-60 overflow-y-auto shadow-md">
              {filteredTabs.map((tab, index) => (
                <li
                  key={index}
                  onClick={() => onTabClick(tab)}
                  className="px-4 py-2 cursor-pointer hover:bg-[#f4e1e1] transition"
                >
                  {tab}
                </li>
              ))}
            </ul>
          )}

          {searchTerm && filteredTabs.length === 0 && (
            <div className="absolute z-10 bg-white border border-[#A36361] rounded-md mt-1 w-full shadow-md px-4 py-2 text-gray-500">
              No matching results
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSearchbar;
