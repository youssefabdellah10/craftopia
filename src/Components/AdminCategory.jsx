import { useEffect, useState } from "react";
import { FaChartBar, FaRegSmileBeam } from "react-icons/fa";
import { Plus } from "lucide-react";

const AdminCategory = ({ setSelected }) => {
  const [requests, setRequests] = useState([]);
  const [, setCategories] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const requestRes = await fetch("http://localhost:3000/category/getrequest", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const requestData = await requestRes.json();
        const catRes = await fetch("http://localhost:3000/category/all");
        const catData = await catRes.json();

        const allRequests = requestData.requestedCategories || [];
        const allCategories = catData.categories || [];

        const filtered = allRequests.filter(
          (req) => !allCategories.some(
            (cat) => cat.name.toLowerCase() === req.name.toLowerCase()
          )
        );

        setRequests(filtered);
        setCategories(allCategories);
      } catch (error) {
        console.error("Error fetching category requests:", error.message);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="bg-[#FAF9F6] w-4/5 ml-6 mt-10">
      <div className="bg-[#F6EEEE] p-6 rounded-2xl border border-black shadow-sm">
        <h2 className="text-2xl font-bold text-[#4B2E2E] mb-6">Requested Categories</h2>

        {requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center text-[#4B2E2E] py-10">
            <FaRegSmileBeam className="text-4xl mb-3 text-[#E07385]" />
            <p className="text-lg font-semibold">No category requests at the moment!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {requests.map((req, index) => (
              <div
                key={index}
                className="relative bg-white border rounded-xl shadow-md p-5 transition-transform hover:scale-[1.02] hover:shadow-lg"
              >
                <button
                  onClick={() => {
                    localStorage.setItem("requestedCategoryName", req.name);
                    setSelected("Add Category");
                  }}
                  className="absolute top-3 right-3 p-1 rounded-md hover:bg-[#f4ccd2] transition"
                  title="Add this category"
                >
                  <Plus className="text-[#E07385]" size={22} />
                </button>

                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[#E07385] text-xl font-bold">#</span>
                  <span className="bg-[#E07385] text-white font-semibold px-4 py-2 rounded-full text-sm">
                    {req.name}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-gray-700 mt-2">
                  <FaChartBar className="text-[#de929f]" />
                  <span className="text-sm font-medium text-[#4B2E2E]">Number of Requests:</span>
                  <span className="text-black text-sm font-bold">{req.counter}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCategory;
