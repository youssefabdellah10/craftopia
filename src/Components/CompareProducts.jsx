import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {toast} from "react-hot-toast";
import {
    X,
    ChevronLeft,
    ChevronRight,
    Star,
    Ruler,
    Palette,
    User,
    Tag,
    PoundSterling,
} from "lucide-react";


const CompareProducts = () => {
    const [products, setProducts] = useState([]);
    const [compareList, setCompareList] = useState([]);
    const navigate = useNavigate();
    useEffect(() => {
        fetch("http://localhost:3000/product/get")
            .then((res) => res.json())
            .then((data) => {
                const normalProducts = data.products.filter(p => p.type === 'normal');
                setProducts(normalProducts);
            })
            .catch((err) => console.error("Error fetching products:", err));
    }, []);

    const addToCompare = (product) => {
        if (compareList.find((p) => p.productId === product.productId)) return;
        if (compareList.length < 4) {
            setCompareList([...compareList, product]);
        } else {
            toast.error("You can compare up to 4 products at once.");
        }
    };

    const scrollLeft = () => {
        const container = document.getElementById("product-scroll");
        container.scrollBy({ left: -300, behavior: "smooth" });
    };

    const scrollRight = () => {
        const container = document.getElementById("product-scroll");
        container.scrollBy({ left: 300, behavior: "smooth" });
    };

    const handleCardClick = (product) => {
        navigate(`/product/${product.productId}`, { state: { product } });
    };

    return (
        <div className="min-h-screen bg-[#FAF9F6] py-8 px-4 sm:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-[#921A40] mb-2">
                        Compare Handmade Treasures
                    </h2>
                </div>
                <div className="relative mb-16">
                    <button
                        onClick={scrollLeft}
                        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-[#921A40] text-white p-2 rounded-full shadow-lg hover:bg-[#7a1535] transition-all"
                        aria-label="Scroll left"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div
                        id="product-scroll"
                        className="flex space-x-6 overflow-x-auto pb-8 px-2 scrollbar-hide"
                        style={{
                            scrollbarWidth: "none",
                            msOverflowStyle: "none",
                        }}
                    >
                        {products.map((product) => (
                            <motion.div
                                key={product.productId}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.98 }}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4 }}
                                className="flex-shrink-0 w-64 rounded-2xl overflow-hidden bg-white shadow hover:shadow-lg cursor-pointer"
                                onClick={() => addToCompare(product)}
                            >
                                <div className="relative">
                                    <div className="w-full h-48 bg-white">
                                        <img
                                            src={product.image[0] || "/placeholder.jpg"}
                                            alt={product.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                </div>
                                <div className="p-4 bg-white space-y-2">
                                    <p className="text-xs uppercase text-[#E07385] font-semibold">
                                        {product.category?.name || "Handmade"}
                                    </p>
                                    <h3 className="font-bold text-gray-900 line-clamp-1">
                                        {product.name}
                                    </h3>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[#921A40] font-bold inline-flex items-center gap-x-0.5">
                                            <PoundSterling className="h-4 w-4 inline-block" />
                                            {product.price}
                                        </span>
                                        <div className="flex items-center text-yellow-500">
                                            <Star size={14} fill="currentColor" />
                                            <span className="text-xs ml-1 text-gray-700">
                                                {Number(product.averageRating || 0).toFixed(1)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                    <button
                        onClick={scrollRight}
                        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-[#921A40] text-white p-2 rounded-full shadow-lg hover:bg-[#7a1535] transition-all"
                        aria-label="Scroll right"
                    >
                        <ChevronRight size={24} />
                    </button>
                </div>
                {compareList.length > 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="bg-white rounded-2xl shadow-lg overflow-x-auto"
                    >
                        <div className="p-6 bg-[rgba(146,26,64,0.80)] text-white">

                            <h3 className="text-xl font-bold text-center">Product Comparison</h3>
                        </div>
                        <table className="min-w-full text-sm text-gray-700">
                            <thead>
                                <tr className="bg-[#FAF9F6] text-[#921A40] text-base border-b border-[#EBD9D5]">
                                    <th className="p-5 text-left font-semibold"></th>
                                    {compareList.map((product) => (
                                        <th
                                            key={product.productId}
                                            className="p-5 text-center relative"
                                        >
                                            <button
                                                onClick={() =>
                                                    setCompareList(compareList.filter((p) => p.productId !== product.productId))
                                                }
                                                className="absolute top-2 right-2 bg-[rgba(146,26,64,0.80)] text-white w-6 h-6 flex items-center justify-center rounded-full hover:bg-[#7a1535] shadow-md transition-all duration-300"
                                                title="Remove"
                                            >
                                                <X size={18} strokeWidth={2} />
                                            </button>

                                            <img
                                                src={product.image[0]}
                                                alt={product.name}
                                                className="w-50 h-50 object-cover rounded-xl mx-auto mb-2 shadow-sm hover:scale-105 transition-transform duration-300"
                                                onClick={() => handleCardClick(product)}
                                            />
                                            <div className="font-semibold text-[#333]">{product.name}</div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    {
                                        icon: <Tag size={16} />,
                                        label: "Category",
                                        accessor: (p) => p.category?.name || "Not specified",
                                    },
                                    {
                                        icon: <Palette size={16} />,
                                        label: "Material",
                                        accessor: (p) => p.material || "Not specified",
                                    },
                                    {
                                        icon: <Ruler size={16} />,
                                        label: "Dimensions",
                                        accessor: (p) => p.dimensions || "Not specified",
                                    },
                                    {
                                        icon: <User size={16} />,
                                        label: "Artist",
                                        accessor: (p) => p.artist?.name || "Unknown",
                                    },
                                    {
                                        icon: <Star size={16} />,
                                        label: "Rating",
                                        accessor: (p) => (
                                            <div className="flex justify-center items-center gap-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        size={14}
                                                        className={`${i < Math.floor(Number(p.averageRating) || 0)
                                                            ? "text-[#E07385] fill-current"
                                                            : "text-gray-300"
                                                            }`}
                                                    />
                                                ))}
                                                <span className="ml-1 text-gray-500 text-xs">
                                                    ({p.totalReviews || 0})
                                                </span>
                                            </div>
                                        ),
                                    },
                                    {
                                        icon: <Tag size={16} />,
                                        label: "Price",
                                        accessor: (p) => (
                                            <span className="text-[#921A40] font-bold inline-flex items-center gap-x-0.5 ">
                                                <PoundSterling className="h-3 w-3 inline-block" />
                                                {p.price}
                                            </span>

                                        ),
                                    },
                                ].map(({ icon, label, accessor }, rowIndex) => (
                                    <tr
                                        key={label}
                                        className={`${rowIndex % 2 === 0 ? "bg-[#F6EEEE]" : "bg-[#FAF9F6]"
                                            } transition-colors`}
                                    >
                                        <td className="p-4 flex items-center gap-2 font-medium text-[black] whitespace-nowrap">
                                            {icon} <span>{label}</span>
                                        </td>
                                        {compareList.map((p) => (
                                            <td key={p.productId} className="p-4 text-center">
                                                {typeof accessor === "function" ? accessor(p) : accessor}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </motion.div>
                ) : (
                    <div className="bg-[#F6EEEE] rounded-2xl p-12 text-center mt-10 shadow-inner">
                        <h3 className="text-xl font-bold text-[#921A40] mb-2">
                            No products selected
                        </h3>
                        <p className="text-gray-600 mb-4">
                            Select up to 4 above to start comparing
                        </p>
                        <div className="flex justify-center space-x-2">
                            {[...Array(3)].map((_, i) => (
                                <div
                                    key={i}
                                    className="w-3 h-3 rounded-full bg-[#E07385] opacity-20 animate-pulse"
                                    style={{ animationDelay: `${i * 0.2}s` }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CompareProducts;
