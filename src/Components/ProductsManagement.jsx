import { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { FaTrashAlt } from "react-icons/fa";

const ProductsManagement = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showConfirm, setShowConfirm] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    const fetchProducts = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get("http://localhost:3000/product/get", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const normalProducts = res.data.products.filter(
                (p) => p.type === "normal"
            );
            setProducts(normalProducts);
        } catch (err) {
            console.error("Error fetching products:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const confirmDelete = (product) => {
        setSelectedProduct(product);
        setShowConfirm(true);
    };

    const handleDelete = async () => {
        if (!selectedProduct) return;
        try {
            const token = localStorage.getItem("token");
            console.log("Token used for deletion:", token);

            await axios.delete(
                `http://localhost:3000/product/delete/${selectedProduct.productId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            setProducts((prev) =>
                prev.filter((p) => p.productId !== selectedProduct.productId)
            );
        } catch (err) {
            console.error("Error deleting product:", err);
        } finally {
            setShowConfirm(false);
            setSelectedProduct(null);
        }
    };

    return (
        <div className="p-6 mt-6">
            <h2 className="text-2xl font-semibold text-black mb-6">Product Management</h2>

            {loading ? (
                <p className="text-gray-500">Loading products...</p>
            ) : products.length === 0 ? (
                <p className="text-gray-500">No normal products found.</p>
            ) : (
                <div className="space-y-5">
                    {products.map((product) => (
                        <div className="w-full max-w-4xl">
                            <div
                                key={product.productId}
                                className="bg-white border border-[#E07385] rounded-xl shadow hover:shadow-md transition p-4 flex items-center justify-between gap-4"
                            >
                                <img
                                    src={product.image?.[0]}
                                    alt={product.name}
                                    className="w-20 h-20 object-cover rounded-md border"
                                />
                                <div className="flex-1 grid grid-cols-3 gap-x-6 text-sm text-gray-700">
                                    <div className="space-y-1">
                                        <div className="text-base font-semibold text-gray-800">{product.name}</div>
                                        <div>
                                            <span className="text-gray-500 font-medium">ID:</span>{" "}
                                            <span className="text-gray-700">{product.productId}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div>
                                            <span className="text-gray-500 font-medium">Artist:</span>{" "}
                                            <span className="text-gray-700">{product.artist?.name}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 font-medium">Quantity:</span>{" "}
                                            <span className="text-gray-700">{product.quantity}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div>
                                            <span className="text-gray-500 font-medium">Price:</span>{" "}
                                            <span className="text-gray-700">${product.price}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 font-medium">Material:</span>{" "}
                                            <span className="text-gray-700">{product.material}</span>
                                        </div>
                                    </div>
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    onClick={() => confirmDelete(product)}
                                    className="p-2 bg-[#FDE8EB] hover:bg-[#E07385] text-[#E07385] hover:text-white rounded-full transition group relative"
                                >
                                    <FaTrashAlt className="w-4 h-4" />
                                    <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10">
                                        Delete product
                                    </span>
                                </motion.button>
                            </div>
                        </div>
                    ))}
                </div>

            )}

            {/* Confirm Deletion Modal */}
            <AnimatePresence>
                {showConfirm && selectedProduct && (
                    <motion.div
                        className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50"
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                    >
                        <div className="bg-white border border-[#E07385] rounded-xl p-5 shadow-xl w-[90vw] max-w-md">
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                Delete <span className="text-[#E07385]">{selectedProduct.name}</span>?
                            </h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Are you sure you want to delete this product? This action cannot be undone.
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-sm"
                                    onClick={() => setShowConfirm(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="px-4 py-2 rounded bg-[#E07385] hover:bg-[#c85b6d] text-white text-sm"
                                    onClick={handleDelete}
                                >
                                    Confirm Delete
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProductsManagement;
