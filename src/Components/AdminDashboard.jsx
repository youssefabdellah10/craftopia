import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  FaUser,
  FaPaintBrush,
  FaBoxOpen,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [startIndex, setStartIndex] = useState(0);
  const [salesData, setSalesData] = useState([]);
  const [overview, setOverview] = useState({
    customers: 0,
    artists: 0,
    products: 0,
  });
  const [popularProducts, setPopularProducts] = useState([]);
  const [overviewFilter, setOverviewFilter] = useState("All Time");
  const [salesFilter, setSalesFilter] = useState("All Time");

  const [overviewDropdownVisible, setOverviewDropdownVisible] = useState(false);
  const [salesDropdownVisible, setSalesDropdownVisible] = useState(false);

  const overviewDropdownRef = useRef(null);
  const salesDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        overviewDropdownRef.current &&
        !overviewDropdownRef.current.contains(event.target)
      ) {
        setOverviewDropdownVisible(false);
      }
      if (
        salesDropdownRef.current &&
        !salesDropdownRef.current.contains(event.target)
      ) {
        setSalesDropdownVisible(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchOverviewData = async () => {
      try {
        const token = localStorage.getItem("token");
        const [artistRes, productRes, customerRes] = await Promise.all([
          axios.get("http://localhost:3000/artist/all", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("http://localhost:3000/product/get", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("http://localhost:3000/customer/all-customers", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const now = new Date();

        const filterByDate = (createdAt) => {
          const date = new Date(createdAt);
          switch (overviewFilter) {
            case "Today":
              return date.toDateString() === now.toDateString();
            case "This Week": {
              const startOfWeek = new Date(now);
              startOfWeek.setDate(now.getDate() - now.getDay());
              startOfWeek.setHours(0, 0, 0, 0);
              return date >= startOfWeek && date <= now;
            }
            case "This Month":
              return (
                date.getMonth() === now.getMonth() &&
                date.getFullYear() === now.getFullYear()
              );
            case "This Year":
              return date.getFullYear() === now.getFullYear();
            default:
              return true;
          }
        };

        const filteredArtists = artistRes.data.artists.filter((artist) =>
          filterByDate(artist.createdAt)
        );
        const filteredProducts = productRes.data.products.filter((product) =>
          filterByDate(product.createdAt)
        );
        const filteredCustomers = customerRes.data.customers.filter((customer) =>
          filterByDate(customer.createdAt)
        );

        setOverview({
          customers: filteredCustomers.length.toLocaleString(),
          artists: filteredArtists.length.toLocaleString(),
          products: filteredProducts.length.toLocaleString(),
        });
      } catch (error) {
        console.error("Error fetching overview data:", error);
      }
    };

    fetchOverviewData();
  }, [overviewFilter]);



  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:3000/trackSales/salesHistory", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const rawSales = response.data.data;
        const grouped = {};

        rawSales.forEach((sale) => {
          const date = new Date(sale.saleDate);
          let key;

          switch (salesFilter) {
            case "Today":
              key = "Today";
              break;
            case "This Week":
              key = date.toLocaleDateString("en-US", { weekday: "short" });
              break;

            case "This Month":
              key = `Week ${Math.ceil(date.getDate() / 7)}`;
              break;
            case "This Year":
              key = date.toLocaleString("default", { month: "short" });
              break;
            case "All Time":
              key = date.getFullYear().toString();
              break;
            default:
              key = date.toLocaleString("default", { month: "short", year: "numeric" });
              break;
          }


          if (!grouped[key]) grouped[key] = 0;
          grouped[key] += parseFloat(sale.salesAmount);
        });

        const fillMissingLabels = (filter) => {
          const now = new Date();
          const filled = [];

          if (filter === "This Year") {
            const months = Array.from({ length: 12 }, (_, i) =>
              new Date(now.getFullYear(), i).toLocaleString("default", { month: "short" })
            );
            months.forEach((month) => {
              filled.push({ month, sales: grouped[month] || 0 });
            });
          }

          if (filter === "All Time") {
            const currentYear = now.getFullYear();
            for (let i = currentYear - 5; i <= currentYear; i++) {
              filled.push({ month: `${i}`, sales: grouped[i] || 0 });
            }
          }

          if (filter === "This Month") {
            for (let i = 1; i <= 5; i++) {
              const label = `Week ${i}`;
              filled.push({ month: label, sales: grouped[label] || 0 });
            }
          }

          if (filter === "This Week") {
            const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            days.forEach((day) => {
              filled.push({ month: day, sales: grouped[day] || 0 });
            });
          }

          if (filter === "Today") {
            filled.push({ month: "Today", sales: grouped["Today"] || 0 });
          }

          return filled;
        };

        const formatted = fillMissingLabels(salesFilter);
        setSalesData(formatted);
      } catch (error) {
        console.error("Error fetching sales data:", error);
      }
    };

    fetchSalesData();
  }, [salesFilter]);

  useEffect(() => {
    const fetchPopularProducts = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:3000/product/get", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const allProducts = response.data.products || [];

        const topSelling = allProducts
          .filter((p) => p.sellingNumber > 0)
          .sort((a, b) => b.sellingNumber - a.sellingNumber)
          .slice(0, 10);

        const formatted = topSelling.map((product) => ({
          id: product.productId,
          title: product.name,
          image: product.image?.[0],
          price: Number(product.price),
          artist: product.artist?.name || "",
          category: product.category?.name || "",
          rating: product.averageRating || 0,
          reviews: product.totalReviews || 0,
        }));

        setPopularProducts(formatted);
      } catch (error) {
        console.error("Error fetching popular products:", error);
      }
    };

    fetchPopularProducts();
  }, []);


  const handleNext = () => {
    setStartIndex((prev) => (prev + 1) % popularProducts.length);
  };

  const handlePrev = () => {
    setStartIndex((prev) => (prev - 1 + popularProducts.length) % popularProducts.length);
  };

  const visibleProduct = popularProducts[startIndex];
  const getRoundedMax = (data) => {
    const max = Math.max(...data.map((d) => d.sales));
    return Math.ceil(max / 5000) * 5000;
  };

  return (
    <div className="flex flex-col pl-6 w-full bg-[#FAF9F6] mt-5">
      <div className="flex justify-between items-center w-4/5 mt-6 pr-1">
        <h2 className="text-2xl font-semibold">Dashboard</h2>
        <button
          onClick={() => window.open("/", "_blank")}
          className="flex items-center gap-2 border border-[#E07385] text-[#E07385] px-4 py-1.5 rounded-full text-sm hover:bg-[#E07385] hover:text-white transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 3h7v7m0 0L10 21l-7-7 11-11z" />
          </svg>
          View Site
        </button>
      </div>

      <div className="bg-[#F6EEEE] w-4/5 p-6 mt-2 rounded-2xl border border-black">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Overview</h2>
          <div className="relative inline-block text-left" ref={overviewDropdownRef}>
            <button
              onClick={() => setOverviewDropdownVisible((prev) => !prev)}
              className="bg-[#E07385] text-white px-4 py-1 rounded-md"
            >
              {overviewFilter} ▼
            </button>
            {overviewDropdownVisible && (
              <div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow-lg z-10">
                {["Today", "This Week", "This Month", "This Year", "All Time"].map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setOverviewFilter(option);
                      setOverviewDropdownVisible(false);
                    }}
                    className={`block w-full px-4 py-2 text-left text-sm hover:bg-[#FDECEC] ${option === overviewFilter ? "bg-[#F6EEEE] font-medium" : ""
                      }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-3 border rounded-lg p-4 bg-white">
          <div className="flex flex-col items-center justify-center">
            <FaUser className="text-[#E07385] text-2xl mb-1" />
            <h3 className="text-sm text-gray-600">Customers</h3>
            <p className="text-lg font-bold">{overview.customers}</p>
          </div>
          <div className="flex flex-col items-center justify-center border-x px-4">
            <FaPaintBrush className="text-[#E07385] text-2xl mb-1" />
            <h3 className="text-sm text-gray-600">Artists</h3>
            <p className="text-lg font-bold">{overview.artists}</p>
          </div>
          <div className="flex flex-col items-center justify-center">
            <FaBoxOpen className="text-[#E07385] text-2xl mb-1" />
            <h3 className="text-sm text-gray-600">Products</h3>
            <p className="text-lg font-bold">{overview.products}</p>
          </div>
        </div>
      </div>

      <div className="flex w-4/5 gap-4 mt-4">
        <div className="flex-1 bg-[#F6EEEE] p-6 rounded-2xl border border-black">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">Summary Sales</h2>
            <div className="relative inline-block text-left" ref={salesDropdownRef}>
              <button
                onClick={() => setSalesDropdownVisible((prev) => !prev)}
                className="bg-[#E07385] text-white px-4 py-1 rounded-md"
              >
                {salesFilter} ▼
              </button>
              {salesDropdownVisible && (
                <div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow-lg z-10">
                  {["Today", "This Week", "This Month", "This Year", "All Time"].map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setSalesFilter(option);
                        setSalesDropdownVisible(false);
                      }}
                      className={`block w-full px-4 py-2 text-left text-sm hover:bg-[#FDECEC] ${option === salesFilter ? "bg-[#F6EEEE] font-medium" : ""
                        }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {salesFilter === "Today" ? (
            <div className="text-l bg-white p-4 rounded-xl border mt-6 space-y-2">
              {salesData.length === 0 || salesData[0].sales === 0 ? (
                <p>No sales recorded today.</p>
              ) : (
                salesData.map((entry, index) => (
                  <div key={index} className="flex justify-between">
                    <span className="text-gray-600 font-medium">{entry.month}</span>
                    <span className="font-bold text-[#E07385]">${entry.sales.toFixed(2)}</span>
                  </div>
                ))
              )}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={salesData} barCategoryGap={20}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis
                  domain={[0, getRoundedMax(salesData)]}
                  tickFormatter={(value) => `${(value / 1000).toFixed(1)}k`}
                />

                <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                <Bar dataKey="sales" fill="#E07385" barSize={25} radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="w-64 bg-[#F6EEEE] border border-black rounded-2xl p-6 flex flex-col items-center justify-between">
          <div className="flex justify-between w-full mb-3">
            <button onClick={handlePrev} className="text-[#E07385]">
              <FaChevronLeft />
            </button>
            <h3 className="font-semibold text-sm text-gray-800">Best Selling Products</h3>
            <button onClick={handleNext} className="text-[#E07385]">
              <FaChevronRight />
            </button>
          </div>
          {visibleProduct && (
            <div className="w-full">
              <div
                className="bg-white rounded-xl overflow-hidden w-full h-40 flex items-center justify-center cursor-pointer"
                onClick={() =>
                  navigate(`/product/${visibleProduct.id}`, {
                    state: { product: visibleProduct },
                  })
                }
              >
                <img
                  src={visibleProduct.image}
                  alt={visibleProduct.title}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                />
              </div>

              <div className="w-full mt-2">
                <p
                  onClick={() =>
                    navigate(`/product/${visibleProduct.id}`, {
                      state: { product: visibleProduct },
                    })
                  }
                  className="text-sm font-semibold text-gray-800 cursor-pointer line-clamp-2"
                >
                  {visibleProduct.title}
                </p>

                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-gray-500 font-medium">
                    {visibleProduct.artist}
                  </p>
                  <p className="text-md font-bold text-[#E07385]">
                    ${visibleProduct.price.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

          )}

        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
