import { useState, useEffect } from "react";
import { Upload } from "lucide-react";
import AllProducts from "../Components/AllProducts";

const AddProduct = () => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    categoryName: "",
    quantity: "",
    material: "",
    dimension: "",
    images: [],
  });

  const [images, setImages] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [categoriesList, setCategoriesList] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categoriesError, setCategoriesError] = useState(null);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [imageError, setImageError] = useState("");


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (images.length < 1) {
      setMessage("Please upload at least one image.");
      return;
    }
    if (images.length > 5) {
      setMessage("You can only upload up to 5 images.");
      return;
    }

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) =>
      data.append(key, value)
    );
    images.forEach((image) => data.append("image", image));

    setLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem("token");

      const res = await fetch("http://localhost:3000/product/create", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: data,
      });

      const result = await res.json();
      if (!res.ok) {
        setMessage(result.message || "Failed to create product.");
      } else {
        setMessage("Product created successfully!");
        setFormData({
          name: "",
          description: "",
          price: "",
          categoryName: "",
          quantity: "",
          material: "",
          dimension: "",
        });
        setImages([]);
        setImageError("");
      }
    } catch (error) {
      setMessage("Server error, please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      setCategoriesError(null);
      try {
        const response = await fetch("http://localhost:3000/category/all");
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch categories.");
        }
        const data = await response.json();
        setCategoriesList(data.categories || []);
      } catch (err) {
        console.error("Error fetching categories:", err);
        setCategoriesError(err.message || "Failed to load categories.");
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <div className="p-2 sm:p-6 md:p-10 bg-cream min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-[black]">
          {showAllProducts ? "My Products" : "Add New Product"}
        </h2>
        <button
          onClick={() => setShowAllProducts(!showAllProducts)}
          className="bg-[#7a162e] text-white py-2 px-6 rounded-lg font-medium hover:bg-[#E07385] transition"
        >
          {showAllProducts ? "Add New Product" : "My Products"}
        </button>
      </div>

      {showAllProducts ? (
        <AllProducts />
      ) : (
        <>
          {message && (
            <p
              className={`mb-6 text-center text-lg font-semibold ${message.includes("success") ? "text-green-600" : "text-red-600"
                }`}
            >
              {message}
            </p>
          )}
          <form
            onSubmit={handleSubmit}
            className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto bg-white p-8 rounded-2xl shadow-xl border border-[#f9d2d9]"
          >
            <div className="flex flex-col gap-6">
              <div>
                <label className="block font-semibold text-sm text-[#7a162e] mb-2">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter product name"
                  required
                  className="w-full px-4 py-3 border border-[#f3c7ce] rounded-lg text-gray-700"
                />
              </div>
              <div>
                <label className="block font-semibold text-sm text-[#7a162e] mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter product description"
                  required
                  className="w-full px-4 py-3 border border-[#f3c7ce] rounded-lg text-gray-700 resize-none h-32"
                />
              </div>
              <div>
                <label className="block font-semibold text-sm text-[#7a162e] mb-2">
                  Price <span className="text-red-500">*</span>
                </label>
                <input
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Enter product price"
                  required
                  className="w-full px-4 py-3 border border-[#f3c7ce] rounded-lg text-gray-700"
                />
              </div>
            </div>
            <div className="flex flex-col gap-6">
              <div>
                <label className="block font-semibold text-sm text-[#7a162e] mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    name="categoryName"
                    value={formData.categoryName}
                    onChange={handleChange}
                    required
                    className={`appearance-none w-full px-4 py-3 border border-[#f3c7ce] rounded-lg bg-white ${formData.categoryName === ""
                      ? "text-gray-400"
                      : "text-gray-700"
                      }`}
                  >
                    {loadingCategories ? (
                      <option value="" disabled>Loading categories...</option>
                    ) : categoriesList.length === 0 || categoriesError ? (
                      <option value="" disabled>No categories available</option>
                    ) : (
                      <>
                        <option value="" disabled>Select a category</option>
                        {categoriesList.map((cat) => (
                          <option key={cat._id} value={cat.name}>
                            {cat.name}
                          </option>
                        ))}
                      </>
                    )}

                  </select>
                </div>
              </div>
              <div>
                <label className="block font-semibold text-sm text-[#7a162e] mb-2">
                  Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  type="number"
                  min="0"
                  placeholder="Enter quantity"
                  required
                  className="w-full px-4 py-3 border border-[#f3c7ce] rounded-lg text-gray-700"
                />
              </div>
              <div>
                <label className="block font-semibold text-sm text-[#7a162e] mb-2">
                  Material <span className="text-red-500">*</span>
                </label>
                <input
                  name="material"
                  value={formData.material}
                  onChange={handleChange}
                  placeholder="Enter material"
                  required
                  className="w-full px-4 py-3 border border-[#f3c7ce] rounded-lg text-gray-700"
                />
              </div>
              <div>
                <label className="block font-semibold text-sm text-[#7a162e] mb-2">
                  Dimensions <span className="text-red-500">*</span>
                </label>
                <input
                  name="dimension"
                  value={formData.dimension}
                  onChange={handleChange}
                  placeholder="e.g. 10 x 10 x 10 inches"
                  required
                  className="w-full px-4 py-3 border border-[#f3c7ce] rounded-lg text-gray-700"
                />
              </div>
            </div>
            <div className="md:col-span-2 flex flex-col gap-4">
              <label className="font-semibold text-sm text-[#7a162e]">
                Upload Product Images <span className="text-red-500">*</span>
              </label>

              <div className="relative border-4 border-dashed border-[#E07385] rounded-xl p-6 text-center bg-[#fff0f3]">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const selectedFiles = Array.from(e.target.files);
                    if (selectedFiles.length > 5) {
                      setImageError("You can upload a maximum of 5 images.");
                      return;
                    }
                    setImages(selectedFiles);
                    setImageError("");
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />

                <div className="relative z-0 flex flex-col items-center justify-center pointer-events-none">
                  <Upload className="h-8 w-8 text-burgundy/60 mb-2" />
                  <p className="text-[#7a162e] font-medium">
                    Click or drag to upload images
                  </p>
                  <p className="text-sm text-gray-500">Up to 5 images</p>
                </div>
              </div>
              {imageError && (
                <p className="text-red-500 text-sm mt-2">{imageError}</p>
              )}


              {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                  {images.map((file, index) => (
                    <div
                      key={index}
                      className="relative group overflow-hidden rounded-xl shadow-md border-2 border-[#E07385] bg-white"
                    >
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`preview-${index}`}
                        className="w-full h-32 object-contain"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setImages((prev) => prev.filter((_, i) => i !== index))
                        }
                        className="absolute top-2 right-2 bg-white text-[#E07385] border border-[#E07385] rounded-full px-2 py-0.5 text-xs font-bold hover:bg-[#E07385] hover:text-white"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="md:col-span-2 mt-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-[#E07385] text-white py-3 px-8 rounded-lg font-semibold hover:bg-[#7a162e] transition"
              >
                {loading ? "Uploading..." : "Add Product"}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default AddProduct;
