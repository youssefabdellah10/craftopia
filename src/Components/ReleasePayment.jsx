import { useEffect, useState } from "react";
import axios from "axios";
import { FaCheckCircle, FaExclamationCircle } from "react-icons/fa";

const ReleasePayment = () => {
    const [heldPayments, setHeldPayments] = useState([]);
    const [selectedPayments, setSelectedPayments] = useState([]);
    const [message, setMessage] = useState({ text: "", type: "" });
    const [loading, setLoading] = useState(false);

    const fetchHeldPayments = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get("http://localhost:3000/payment/escrow/held", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setHeldPayments(res.data.data || []);
        } catch (err) {
            console.error("Error fetching escrow payments:", err);
        }
    };

    const handleSelect = (paymentId) => {
        setSelectedPayments((prev) =>
            prev.includes(paymentId)
                ? prev.filter((id) => id !== paymentId)
                : [...prev, paymentId]
        );
    };

    const handleSelectAll = () => {
        if (selectedPayments.length === heldPayments.length) {
            setSelectedPayments([]);
        } else {
            setSelectedPayments(heldPayments.map((p) => p.paymentId));
        }
    };

    const releaseSelected = async () => {
        if (selectedPayments.length === 0) return;

        setLoading(true);
        setMessage({ text: "", type: "" });

        try {
            const token = localStorage.getItem("token");
            for (const id of selectedPayments) {
                await axios.put(
                    `http://localhost:3000/payment/escrow/release/${id}`,
                    {},
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            }
            setMessage({ text: "Payments released successfully!", type: "success" });
            await fetchHeldPayments();
            setSelectedPayments([]);
        } catch (err) {
            setMessage({
                text: err.response?.data?.message || "Failed to release payment(s).",
                type: "error",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHeldPayments();
    }, []);

    return (
        <div className="flex justify-start pl-7 pt-10 w-full pr-6">
            <div className="w-[82%] max-w-6xl">
                <h2 className="text-2xl font-semibold text-black mb-6">Escrow Payments</h2>

                {message.text && (
                    <div
                        className={`mb-4 px-4 py-3 rounded flex items-center gap-2 ${message.type === "success"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-700"
                            }`}
                    >
                        {message.type === "success" ? (
                            <FaCheckCircle className="text-green-600" />
                        ) : (
                            <FaExclamationCircle className="text-red-500" />
                        )}
                        {message.text}
                    </div>
                )}

                {heldPayments.length === 0 ? (
                    <p className="text-center py-12 px-4 bg-[#FAF9F6] text-[#E07385] font-semibold text-lg rounded-xl shadow-sm border border-[#f0dada]">
                        No payments currently held in escrow.
                    </p>

                ) : (
                    <div className="bg-white p-6 rounded-xl shadow-md relative border border-gray-200">
                        <div className="mb-4 flex items-center gap-3">
                            <input
                                type="checkbox"
                                checked={selectedPayments.length === heldPayments.length}
                                onChange={handleSelectAll}
                                className="w-5 h-5 rounded-full accent-[#E07385] border-2 border-gray-300"
                            />
                            <label className="text-gray-700 font-medium">Select All</label>
                        </div>
                        <div className="max-h-[460px] overflow-y-scroll pr-2 space-y-4 hide-scrollbar">
                            {heldPayments.map((payment) => {
                                const isSelected = selectedPayments.includes(payment.paymentId);
                                return (
                                    <div
                                        key={payment.paymentId}
                                        className="flex items-center justify-between bg-[#FAF9F6] border border-[#e5d2d2] px-6 py-3 rounded-lg shadow-sm text-sm"
                                    >
                                        <div className="flex items-center gap-4 w-1/12">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => handleSelect(payment.paymentId)}
                                                className="w-5 h-5 rounded-full accent-[#E07385] border-2 border-gray-300"
                                            />
                                        </div>

                                        <div className="w-full flex justify-between gap-4 items-center text-sm">
                                            <div className="flex flex-col">
                                                <span className="text-gray-500">Payment ID</span>
                                                <span className="font-semibold text-gray-700">{payment.paymentId}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-gray-500">Order ID</span>
                                                <span className="font-semibold text-gray-700">{payment.orderId}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-gray-500">Amount</span>
                                                <span className="font-semibold text-[#E07385]">{payment.amount} EGP</span>
                                            </div>
                                            <div className="flex flex-col max-w-[250px] truncate">
                                                <span className="text-gray-500">Reference</span>
                                                <span className="font-medium text-gray-700 truncate">{payment.paymentReference}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex justify-end mt-6">
                            <button
                                onClick={releaseSelected}
                                disabled={loading || selectedPayments.length === 0}
                                className={`bg-[#E07385] text-white px-6 py-3 rounded-lg font-medium transition hover:bg-[#d45a7a] ${loading || selectedPayments.length === 0
                                        ? "opacity-50 cursor-not-allowed"
                                        : ""
                                    }`}
                            >
                                {loading ? "Releasing..." : "Release Selected"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
            <style>
                {`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        `}
            </style>
        </div>
    );
};

export default ReleasePayment;
