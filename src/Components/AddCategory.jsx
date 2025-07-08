import { useEffect, useState } from "react";
import { PlusCircle, Tag } from "lucide-react";

const AddCategory = () => {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);


  useEffect(() => {
  const storedName = localStorage.getItem("requestedCategoryName");
  if (storedName) {
    setName(storedName);
    localStorage.removeItem("requestedCategoryName");
  }
}, []);


  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("http://localhost:3000/category/all");
        const data = await res.json();
        setCategories(data.categories || []);
      } catch (err) {
        console.error("Failed to fetch categories:", err.message);
      }
    };
    fetchCategories();
  }, [message]);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setMessage("Category name is required!");
      return;
    }

    const isDuplicate = categories.some(
      (cat) => cat.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (isDuplicate) {
      setMessage("This category already exists!");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:3000/category/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: trimmedName }),
      });

      const result = await res.json();
      if (!res.ok) {
        setMessage(result.message || "Failed to add category.");
      } else {
        setMessage("Category added successfully!");
        setName("");
      }
    } catch {
      setMessage("Server error, please try again later.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="max-h-screen bg-[#FAF9F6] p-20 pl-0 flex items-center justify-center mr-33">
      <div className="w-full max-w-4xl bg-white border border-[#e4cfcf] rounded-3xl shadow-xl p-10 flex flex-col md:flex-row gap-8">
        <div className="md:w-1/2 w-full pt-20">
          <div className="flex items-center gap-2 mb-6">
            <PlusCircle className="text-[#E07385]" size={26} />
            <h2 className="text-2xl font-bold text-[#4B2E2E]">Add New Category</h2>
          </div>

          {message && (
            <div
              className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium shadow-sm ${message.includes("success")
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
                }`}
            >
              {message}
            </div>
          )}

          <form onSubmit={handleAddCategory} className="space-y-5">
            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Category Name
              </label>
              <input
                id="category"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter category name"
                className="w-full px-4 py-2 border border-gray-300 rounded-xl shadow-inner bg-white focus:outline-none focus:ring-2 focus:ring-[#E07385]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 text-white font-semibold rounded-xl transition-all ${loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[#E07385] hover:bg-[#c75c6f] shadow-lg"
                }`}
            >
              {loading ? "Adding..." : "Add Category"}
            </button>
          </form>
        </div>
        <div className="md:w-1/2 w-full bg-[#FFF3F5] rounded-xl border border-[#ecc9cf] p-4 h-fit max-h-[400px] overflow-y-auto scrollbar-hide">
          <h3 className="text-lg font-semibold text-[#4B2E2E] mb-3 flex items-center gap-2">
            <Tag size={20} className="text-[#E07385]" />
            Current Categories
          </h3>

          {categories.length === 0 ? (
            <p className="text-sm text-gray-600">No categories found.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {categories.map((cat, idx) => (
                <li
                  key={idx}
                  className="bg-white border border-[#f0c9ce] text-[#4B2E2E] px-4 py-2 rounded-lg text-sm shadow hover:bg-[#fbe7e9] transition"
                >
                  {cat.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddCategory;
