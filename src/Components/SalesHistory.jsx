import { useEffect, useState, useMemo, useRef } from "react";
import axios from "axios";
import { format, isAfter, isBefore } from "date-fns";
import { BarChart2, CalendarDays } from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";

const SalesHistory = () => {
    const [sales, setSales] = useState([]);
    const [filteredSales, setFilteredSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [artistId, setArtistId] = useState(null);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [visibleCount, setVisibleCount] = useState(6);


    const startDateRef = useRef(null);
    const endDateRef = useRef(null);

    useEffect(() => {
        const fetchSalesData = async () => {
            setLoading(true);
            setError(null);

            const token = localStorage.getItem("token");
            if (!token) {
                setError("Not authenticated.");
                setLoading(false);
                return;
            }

            try {
                const profileRes = await axios.get("http://localhost:3000/artist/myprofile", {
                    headers: { Authorization: `Bearer ${token}` },
                });

                const artist = profileRes.data?.ArtistProfile;
                const fetchedArtistId = artist?.artistId;
                if (!fetchedArtistId) throw new Error("Artist ID not found");
                setArtistId(fetchedArtistId);

                const salesRes = await axios.get(
                    `http://localhost:3000/trackSales/Salesofartist/${fetchedArtistId}`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );

                const data = salesRes.data.data || [];
                setSales(data);
                setFilteredSales(data);
            } catch (err) {
                console.error(err);
                setError(err.response?.data?.message || err.message || "Failed to load sales.");
            } finally {
                setLoading(false);
            }
        };

        fetchSalesData();
    }, []);

    const handleFilter = () => {
        let filtered = sales;
        if (startDate)
            filtered = filtered.filter((s) =>
                isAfter(new Date(s.saleDate), new Date(startDate))
            );
        if (endDate)
            filtered = filtered.filter((s) =>
                isBefore(new Date(s.saleDate), new Date(endDate))
            );
        setFilteredSales(filtered);
        setVisibleCount(6);

    };

    const chartData = useMemo(() => {
        const map = {};
        const now = new Date();
        for (let i = -6; i <= 5; i++) {
            const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
            const key = format(date, "MMM yyyy");
            map[key] = { name: key, revenue: 0 };
        }
        filteredSales.forEach((sale) => {
            const date = new Date(sale.saleDate);
            const key = format(date, "MMM yyyy");
            if (map[key]) {
                map[key].revenue += parseFloat(sale.salesAmount);
            }
        });


        return Object.values(map);
    }, [filteredSales]);
    const maxRevenue = Math.max(...chartData.map((d) => d.revenue), 0);


    if (loading) {
        return (
            <div className="text-center py-20 text-gray-600">
                <span className="text-lg">Loading sales...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-20 text-red-600">
                <span>{error}</span>
            </div>
        );
    }

    if (!loading && sales.length === 0) {
        return (
            <div className="bg-white p-10 mt-8 rounded-lg shadow-md text-center">
                <div className="w-20 h-20 mx-auto flex items-center justify-center rounded-full bg-[#FFF0ED] mb-4 animate-pulse">
                    <BarChart2 className="text-[#E07385]" size={36} />
                </div>
                <h2 className="text-xl font-semibold text-[#E07385] mb-2">No Sales Yet</h2>
                <p className="text-gray-500">
                    You haven’t made any sales yet. Once your products start selling, they’ll show up here.
                </p>
            </div>
        );
    }

    return (
        <div className="p-6">

            <div className="flex items-center gap-2 mb-8">
                <BarChart2 className="text-black" />
                <h2 className="text-2xl font-semibold text-black">Sales History</h2>
            </div>
            <div className="mb-8 flex justify-end items-center gap-6 flex-wrap">
                <div className="flex items-center gap-2 relative">
                    <label className="text-sm text-gray-700 font-medium">Start Date:</label>
                    <button
                        onClick={() => startDateRef.current?.showPicker()}
                        type="button"
                        className="w-10 h-10 rounded-full bg-[#E07385] text-white flex items-center justify-center hover:bg-[#921A40] shadow"
                    >
                        <CalendarDays size={18} />
                    </button>
                    <input
                        ref={startDateRef}
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="absolute opacity-0 w-10 h-10 inset-0 cursor-pointer"
                    />
                </div>
                <div className="flex items-center gap-2 relative">
                    <label className="text-sm text-gray-700 font-medium">End Date:</label>
                    <button
                        onClick={() => endDateRef.current?.showPicker()}
                        type="button"
                        className="w-10 h-10 rounded-full bg-[#E07385] text-white flex items-center justify-center hover:bg-[#921A40] shadow"
                    >
                        <CalendarDays size={18} />
                    </button>
                    <input
                        ref={endDateRef}
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="absolute opacity-0 w-10 h-10 inset-0 cursor-pointer"
                    />
                </div>
                <button
                    onClick={handleFilter}
                    className="bg-[#E07385] text-white px-5 py-2 rounded-full font-medium hover:bg-[#921A40] transition shadow"
                >
                    Apply
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-10">
                {filteredSales.slice(0, visibleCount).map((sale, index) => (
                    <div
                        key={sale.salesId}
                        className="bg-white border border-[#FFDAD6] rounded-xl p-4 shadow-sm hover:shadow-md transition"
                    >
                        <div className="text-sm text-gray-500 mb-1 font-medium">
                            Sale #{index + 1}
                        </div>
                        <div className="text-lg font-semibold text-[#E07385]">
                            {parseFloat(sale.salesAmount).toFixed(2)} {sale.currency}
                        </div>
                        <div className="text-gray-600 text-sm mt-2">
                            {format(new Date(sale.saleDate), "MMMM d, yyyy • h:mm a")}
                        </div>
                    </div>
                ))}
            </div>
            {visibleCount < filteredSales.length && (
                <div className="text-center mb-10">
                    <button
                        onClick={() => setVisibleCount((prev) => prev + 6)}
                        className="px-6 py-2 rounded-full bg-[#E07385] text-white font-medium hover:bg-[#921A40] shadow transition"
                    >
                        Show More
                    </button>
                </div>
            )}

            {filteredSales.length === 0 ? (
                <div className="text-center py-16 bg-white border border-[#FFDAD6] rounded-xl shadow-sm">
                    <div className="w-16 h-16 mx-auto flex items-center justify-center rounded-full bg-[#FFF0ED] mb-4">
                        <BarChart2 className="text-[#E07385]" size={32} />
                    </div>
                    <h3 className="text-lg font-semibold text-[#E07385] mb-2">
                        No Sales in Selected Range
                    </h3>

                </div>
            ) : (
                <div className="bg-white border border-[#FFDAD6] rounded-xl p-6 shadow-sm hover:shadow-md transition">
                    <h3 className="text-lg font-semibold text-[#E07385] mb-4">Revenue by Month</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ left: 10, right: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fontSize: 10 }}
                                    interval={0}
                                    angle={-30}
                                    textAnchor="end"
                                />
                                <YAxis
                                    tick={{ fontSize: 12 }}
                                    domain={[0, Math.ceil(maxRevenue * 1.2)]}
                                />
                                <Tooltip />
                                <Legend />
                                <Bar
                                    dataKey="revenue"
                                    fill="#E07385"
                                    name="Total Revenue"
                                    barSize={20}
                                    radius={[10, 10, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

        </div>
    );
};

export default SalesHistory;
