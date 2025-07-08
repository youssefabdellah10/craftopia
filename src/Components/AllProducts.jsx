import { useEffect, useState } from "react";
import { FaEdit } from "react-icons/fa";
import { motion } from "framer-motion";
import { FaTrash } from "react-icons/fa";
import toast from "react-hot-toast";
const AllProducts = () => {
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productError, setProductError] = useState(null);
  const [artistId, setArtistId] = useState(null);
  const [updatedProductData, setUpdatedProductData] = useState({});
  const [selectedProductName, setSelectedProductName] = useState("");
  const [expandedProductId, setExpandedProductId] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:3000/artist/myprofile", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch artist profile");
        const data = await res.json();
        setArtistId(data.ArtistProfile?.artistId);
      } catch (err) {
        setProductError("Failed to load artist profile.");
      }
    };

    fetchProfile();
  }, []);

  const fetchProducts = async () => {
    if (!artistId) return;
    setLoadingProducts(true);
    setProductError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:3000/product/get/${artistId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error("Failed to fetch products.");
      const data = await res.json();
      setProducts(data.products || []);

      const initialEditData = {};
      data.products.forEach((p) => {
        initialEditData[p.productId] = {
          name: p.name,
          description: p.description,
          price: p.price,
          quantity: p.quantity,
          dimensions: p.dimensions,
          material: p.material,
        };
      });
      setUpdatedProductData(initialEditData);
    } catch (err) {
      setProductError(err.message);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [artistId]);

  const handleInputChange = (e, productId) => {
    const { name, value } = e.target;
    setUpdatedProductData((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [name]: value,
      },
    }));
  };

  const handleUpdateProduct = async (productId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:3000/product/update/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedProductData[productId]),
      });

      if (!response.ok) throw new Error("Update failed");
      toast.success("Product updated successfully!");
      fetchProducts();
      setExpandedProductId(null);
    } catch (err) {
      toast.error(`Update failed: ${err.message}`);
    }
  };


  const handleDeleteProduct = async (productId) => {
    const confirmed = window.confirm("Are you sure you want to delete this product?");
    if (!confirmed) return;
    const previousProducts = [...products];
    setProducts((prev) => prev.filter((p) => p.productId !== productId));

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:3000/product/delete/${productId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Delete failed");
      }

      toast.success("Product deleted successfully!");
    } catch (err) {
      setProducts(previousProducts);
      toast.error(`Error: ${err.message}`);
    }
  };

  const toggleExpand = (productId) => {
    setExpandedProductId((prev) => (prev === productId ? null : productId));
  };

  const filteredProducts = selectedProductName
    ? products.filter((p) => p.name === selectedProductName)
    : products;

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="mb-10 max-w-md mx-auto relative">
        <select
          value={selectedProductName}
          onChange={(e) => setSelectedProductName(e.target.value)}
          className="w-full appearance-none px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#921A40] pr-10"
        >
          <option value="">All Products</option>
          {products.map((product) => (
            <option key={product.productId} value={product.name}>
              {product.name}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {loadingProducts && <p className="text-center text-lg text-gray-700">Loading products...</p>}
      {productError && <p className="text-center text-red-600">{productError}</p>}
      {!loadingProducts && filteredProducts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="relative w-40 h-40 mb-6">
            <img
              src="https://cdn-icons-png.flaticon.com/512/4076/4076549.png"
              alt="No products"
              className="w-full h-full object-contain opacity-80 animate-bounce"
            />
          </div>
          <h2 className="text-2xl font-bold text-gray-700 mb-2">No Products Found</h2>
          <p className="text-gray-500 text-sm mb-4 text-center max-w-sm">
            Sorry! We couldn’t find any matching items. Try adjusting your filters.
          </p>
          <button
            onClick={() => setSelectedProductName("")}
            className="px-5 py-2 bg-[#e07385] hover:bg-[#7a1434] text-white text-sm font-semibold rounded-full shadow-md transition duration-300"
          >
            Reset Filters
          </button>
        </div>
      )}


      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
        {filteredProducts.map((product, index) => {
          const isExpanded = expandedProductId === product.productId;

          return (
            <motion.div
              key={product.productId}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
              whileHover={{ y: -5 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col h-auto"
            >

              <div className="relative w-full">
                <img
                  src={product.image?.[0] || "https://via.placeholder.com/300"}
                  alt={product.name}
                  className="w-full h-64 object-cover rounded-t-2xl transition-transform duration-300 hover:scale-105"
                />
                <span
                  className={`absolute top-4 right-4 px-3 py-1 rounded-full shadow text-sm font-semibold ${product.quantity > 0 ? "bg-[#e07385] text-white" : "bg-red-100 text-red-800"
                    }`}
                >
                  {product.quantity > 0 ? "In Stock" : "Out of Stock"}
                </span>
                <button
                  onClick={() => handleDeleteProduct(product.productId)}
                  className="absolute top-4 left-4 p-2 rounded-full bg-white text-gray-700 shadow-md hover:bg-red-100 hover:text-red-800 transition-all duration-300"
                  title="Delete Product"
                >
                  <FaTrash className="text-base" />
                </button>
              </div>


              <div className="p-5 flex flex-col h-auto">
                {!isExpanded ? (
                  <>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.name}</h3>
                    <p className="text-gray-700 text-sm mb-6 line-clamp-2">
                      {product.description || "No description available."}
                    </p>
                    <button
                      onClick={() => toggleExpand(product.productId)}
                      className="mt-auto flex items-center justify-center gap-2 bg-[#e07385] text-white rounded-md py-2 text-sm font-semibold hover:bg-[#7a1434] transition duration-200"
                    >
                      <FaEdit className="text-sm" />
                      Edit
                    </button>

                  </>
                ) : (
                  <>
                    <div className="flex flex-wrap -mx-2 gap-y-4">
                      {["name", "description", "price", "quantity", "dimensions", "material"].map((field) => (
                        <div key={field} className="w-1/2 px-2">
                          <label className="block text-xs font-medium text-gray-800 capitalize mb-1">
                            {field}
                          </label>
                          <input
                            name={field}
                            type="text"
                            value={updatedProductData[product.productId]?.[field] || ""}
                            onChange={(e) => handleInputChange(e, product.productId)}
                            className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-[#921A40]"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 flex gap-3">
                      <button
                        onClick={() => handleUpdateProduct(product.productId)}
                        className="flex-1 flex items-center justify-center gap-2 bg-[#921A40] text-white rounded-md py-2 text-sm font-semibold hover:bg-[#7a1434] transition duration-200"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => toggleExpand(null)}
                        className="flex-1 flex items-center justify-center gap-2 border border-gray-300 rounded-md py-2 text-sm font-semibold hover:bg-gray-100 transition duration-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default AllProducts;
