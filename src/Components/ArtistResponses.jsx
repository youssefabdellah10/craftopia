import { useEffect, useState } from "react";
import { EnvelopeIcon, FlagIcon } from "@heroicons/react/24/solid";
import { motion } from "framer-motion";
import Messages from "./Messages";
import { EllipsisVerticalIcon, TruckIcon } from '@heroicons/react/24/outline';

const ArtistResponses = () => {
    const [responses, setResponses] = useState([]);
    const [statistics, setStatistics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeMessageId, setActiveMessageId] = useState(null);
    const [unreadMessages, setUnreadMessages] = useState([]);
    const [newMessageNotification, setNewMessageNotification] = useState(null);
    const [reportingUsername, setReportingUsername] = useState(null);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportToast, setReportToast] = useState({ show: false, message: "", success: true });
    const [attachment, setAttachment] = useState(null);
    const [reportSuccess, setReportSuccess] = useState(false);
    const [shippingToast, setShippingToast] = useState({ show: false, message: "", success: true });

    const getUnreadCount = (responseId) => {
        return unreadMessages.filter(msg => msg.responseId === responseId).length;
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem("token");
                const responsesRes = await fetch("http://localhost:3000/customizationResponse/artist/responses", {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!responsesRes.ok) throw new Error("Failed to fetch responses.");
                const data = await responsesRes.json();
                setResponses(data.responses);
                setStatistics(data.statistics);
                const messagesRes = await fetch("http://localhost:3000/msg/unread", {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!messagesRes.ok) throw new Error("Failed to fetch unread messages.");
                const messagesData = await messagesRes.json();
                setUnreadMessages(messagesData.data.unreadMessages || []);

            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (unreadMessages.length > 0) {
            const latestMessage = unreadMessages[unreadMessages.length - 1];
            const response = responses.find(r => r.responseId === latestMessage.responseId);

            if (response) {
                setNewMessageNotification({
                    customer: response.customizationrequest.customer.username,
                    request: response.customizationrequest.title,
                    responseId: response.responseId
                });

                const timer = setTimeout(() => {
                    setNewMessageNotification(null);
                }, 5000);

                return () => clearTimeout(timer);
            }
        }
    }, [unreadMessages, responses]);
    useEffect(() => {
        if (reportToast.show) {
            const timer = setTimeout(() => {
                setReportToast({ show: false, message: "", success: true });
            }, 4000);

            return () => clearTimeout(timer);
        }
    }, [reportToast]);

    const [reportContent, setReportContent] = useState("");

    if (loading) return <div className="text-center py-8">Loading responses...</div>;
    if (error) return <div className="text-center text-red-600 py-8">{error}</div>;

    const handleReportSubmit = async () => {
        if (!reportContent.trim()) {
            setReportToast({ show: true, message: "Please enter a reason for the report.", success: false });
            return;
        }


        try {
            const token = localStorage.getItem("token");
            const formData = new FormData();
            formData.append("content", reportContent);
            if (attachment) {
                formData.append("attachment", attachment);
            }

            const res = await fetch(`http://localhost:3000/report/createReportUser/${reportingUsername}`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await res.json();

            if (res.ok) {
                setReportSuccess(true);

                setTimeout(() => {
                    setShowReportModal(false);
                    setReportSuccess(false);
                    setReportContent("");
                    setAttachment(null);
                }, 3000);
            } else {
                setReportToast({ show: true, message: data.message || "Failed to submit report.", success: false });
            }
        } catch (error) {
            console.error(error);
            setReportToast({ show: true, message: "An error occurred while submitting the report.", success: false });
        }
    };
    const handleShipOrder = async (responseId) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:3000/order/ship/${responseId}`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await res.json();

            if (res.ok) {
                setShippingToast({ show: true, message: "Order shipped successfully!", success: true });
            } else {
                throw new Error(data.message || "Shipping failed.");
            }
        } catch (error) {
            setShippingToast({ show: true, message: error.message, success: false });
        } finally {
            setTimeout(() => setShippingToast({ show: false, message: "", success: true }), 4000);
        }
    };


    return (
        <>
            {reportToast.show && (
                <motion.div
                    initial={{ y: -40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -40, opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg text-sm font-medium
      ${reportToast.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"}
    `}
                >
                    {reportToast.message}
                </motion.div>
            )}


            {shippingToast.show && (
                <motion.div
                    initial={{ y: -40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -40, opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg text-sm font-medium
      ${shippingToast.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"}`}
                >
                    {shippingToast.message}
                </motion.div>
            )}
            <div className="max-w-5xl mx-auto px-6 py-8 bg-[#FAF9F6]">
                {newMessageNotification && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed bottom-6 right-6 z-50"
                        onClick={() => {
                            setActiveMessageId(newMessageNotification.responseId);
                            setNewMessageNotification(null);
                        }}
                    >
                        <div className="relative w-80 bg-gradient-to-br from-[#FFF5F7] to-white rounded-xl shadow-2xl overflow-hidden border border-[#f8d7dd]">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#E07385] to-[#921A40]"></div>
                            <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-[#f8d7dd] opacity-20"></div>

                            <div className="p-5">
                                <div className="flex items-start gap-4">
                                    <motion.div
                                        animate={{
                                            rotate: [0, 15, -15, 0],
                                            transition: { duration: 0.7 }
                                        }}
                                        className="shrink-0"
                                    >
                                        <div className="relative">
                                            <div className="w-14 h-14 bg-gradient-to-br from-[#E07385] to-[#921A40] rounded-xl flex items-center justify-center shadow-md">
                                                <EnvelopeIcon className="h-7 w-7 text-white" />
                                            </div>
                                            <motion.div
                                                className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm border-2 border-[#E07385]"
                                                animate={{
                                                    scale: [1, 1.2, 1],
                                                    transition: { repeat: Infinity, duration: 1.5 }
                                                }}
                                            >
                                                <span className="text-xs font-bold text-[#E07385]">
                                                    {getUnreadCount(newMessageNotification.responseId)}
                                                </span>
                                            </motion.div>
                                        </div>
                                    </motion.div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <h3 className="text-lg font-bold text-[#921A40]">New Message!</h3>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setNewMessageNotification(null);
                                                }}
                                                className="text-gray-400 hover:text-[#E07385] transition p-1"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </div>

                                        <p className="text-gray-700 mt-2">
                                            <span className="font-semibold text-[#E07385]">@{newMessageNotification.customer}</span> sent you a message
                                        </p>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Regarding: <span className="font-medium">"{newMessageNotification.request}"</span>
                                        </p>

                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className="w-full mt-4 bg-gradient-to-r from-[#E07385] to-[#921A40] text-white py-2 rounded-lg font-medium flex items-center justify-center gap-2 shadow-md"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
                                            </svg>
                                            Open Conversation
                                        </motion.button>
                                    </div>
                                </div>
                            </div>
                            <motion.div
                                initial={{ scaleX: 1 }}
                                animate={{ scaleX: 0 }}
                                transition={{ duration: 5, ease: "linear" }}
                                className="h-1.5 bg-[#f8d7dd]"
                            >
                                <div className="h-full bg-gradient-to-r from-[#E07385] to-[#921A40] origin-left"></div>
                            </motion.div>
                        </div>
                    </motion.div>
                )}

                {statistics && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <div className="bg-[#F6EEEE] p-4 rounded-lg shadow">
                            <h3 className="text-lg font-semibold text-[#E07385]">Pending</h3>
                            <p className="text-2xl font-bold">{statistics.pending}</p>
                        </div>
                        <div className="bg-[#F6EEEE] p-4 rounded-lg shadow">
                            <h3 className="text-lg font-semibold text-[#E07385]">Accepted</h3>
                            <p className="text-2xl font-bold">{statistics.accepted}</p>
                        </div>
                        <div className="bg-[#F6EEEE] p-4 rounded-lg shadow">
                            <h3 className="text-lg font-semibold text-[#E07385]">Declined</h3>
                            <p className="text-2xl font-bold">{statistics.declined}</p>
                        </div>
                    </div>
                )}

                {responses.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                        className="text-center bg-gradient-to-br from-[#FFF5F7] to-[#FDFDFD] border border-[#FADADD] rounded-2xl p-10 shadow-lg"
                    >
                        <div className="flex flex-col items-center space-y-5">
                            <motion.div
                                animate={{ rotate: [0, 10, -10, 0] }}
                                transition={{ repeat: Infinity, duration: 4 }}
                                className="bg-[#E07385]/10 p-4 rounded-full"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-16 w-16 text-[#E07385]"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                        d="M9.75 9.75h4.5m-4.5 3h2.25M5.25 4.5A2.25 2.25 0 007.5 2.25h9a2.25 2.25 0 012.25 2.25v15l-3.375-2.25H7.5A2.25 2.25 0 015.25 15V4.5z"
                                    />
                                </svg>
                            </motion.div>

                            <h2 className="text-2xl font-bold text-[#921A40]">No Offers Submitted</h2>

                            <p className="text-gray-700 max-w-md text-sm md:text-base">
                                You haven’t responded to any customization requests yet.
                                Once you submit an offer, it will be shown here. Start creating something amazing!
                            </p>
                        </div>
                    </motion.div>


                ) : (
                    <div className="space-y-6">
                        {responses.map((response) => (
                            <div key={response.responseId} className="bg-[#F6EEEE] p-6 pr-15 rounded-lg shadow-md relative">
                                {response.status === "ACCEPTED" && (
                                    <motion.div
                                        className="absolute -top-4 -right-4"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                    >
                                        <motion.div
                                            className="relative group"
                                            whileHover="hover"
                                            initial={false}
                                        >
                                            <motion.div
                                                className="w-11 h-11 bg-[#921A40] rounded-full shadow-lg flex items-center justify-center cursor-pointer z-20"
                                                whileTap={{ scale: 0.95 }}
                                            >
                                                <EllipsisVerticalIcon className="h-5 w-5 text-white" />
                                            </motion.div>
                                            <motion.div
                                                className="absolute right-0 mt-2 flex flex-col space-y-3 origin-top z-10"
                                                variants={{
                                                    hover: {
                                                        opacity: 1,
                                                        y: 0,
                                                        transition: { staggerChildren: 0.1 }
                                                    }
                                                }}
                                                initial={{ opacity: 0, y: -10 }}
                                            >
                                                <motion.div
                                                    variants={{ hover: { x: 0, opacity: 1 } }}
                                                    initial={{ x: 20, opacity: 0 }}
                                                    className="flex items-center justify-end"
                                                >
                                                    <div
                                                        onClick={() => setActiveMessageId(response.responseId)}
                                                        className="w-10 h-10 bg-white rounded-full shadow hover:bg-gray-100 flex items-center justify-center transition"
                                                        title="Message"
                                                    >
                                                        <div className="relative">
                                                            <EnvelopeIcon className="h-5 w-5 text-[#921A40]" />
                                                            {getUnreadCount(response.responseId) > 0 && (
                                                                <span className="absolute -top-1 -right-1 h-4 w-4 bg-[#921A40] text-white text-[10px] font-semibold rounded-full flex items-center justify-center">
                                                                    {getUnreadCount(response.responseId)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                                <motion.div
                                                    variants={{ hover: { x: 0, opacity: 1 } }}
                                                    initial={{ x: 20, opacity: 0 }}
                                                    className="flex items-center justify-end"
                                                >
                                                    <div
                                                        onClick={() => {
                                                            setReportingUsername(response.customizationrequest.customer.username);
                                                            setShowReportModal(true);
                                                        }}
                                                        className="w-10 h-10 bg-white rounded-full shadow hover:bg-gray-100 flex items-center justify-center transition"
                                                        title="Report"
                                                    >
                                                        <FlagIcon className="h-5 w-5 text-[#921A40]" />
                                                    </div>
                                                </motion.div>
                                                <motion.div
                                                    variants={{ hover: { x: 0, opacity: 1 } }}
                                                    initial={{ x: 20, opacity: 0 }}
                                                    className="flex items-center justify-end"
                                                >
                                                    <div
                                                        onClick={() => handleShipOrder(response.responseId)}
                                                        className="w-10 h-10 bg-white rounded-full shadow hover:bg-gray-100 flex items-center justify-center transition"
                                                        title="Ship"
                                                    >
                                                        <TruckIcon className="h-5 w-5 text-emerald-600" />
                                                    </div>
                                                </motion.div>
                                            </motion.div>
                                            <motion.div
                                                className="absolute right-14 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-xs px-2.5 py-1.5 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                            >
                                                Quick Actions
                                            </motion.div>
                                        </motion.div>
                                    </motion.div>
                                )}
                                <div className="flex flex-col md:flex-row gap-6">
                                    {response.customizationrequest.image && (
                                        <div className="md:w-1/4">
                                            <img
                                                src={response.customizationrequest.image}
                                                alt="Request"
                                                className="w-full h-40 object-cover rounded-lg shadow"
                                            />
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start flex-wrap gap-4">
                                            <div>
                                                <h3 className="text-xl font-semibold text-black">
                                                    {response.customizationrequest.title}
                                                </h3>
                                                <p className="text-gray-600">
                                                    Request by: @{response.customizationrequest.customer.username}
                                                </p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${response.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                response.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                {response.status}
                                            </span>
                                        </div>

                                        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <p className="text-gray-500 font-medium">Your Price</p>
                                                <p className="text-lg font-semibold">💰 {response.price} LE</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 font-medium">Estimated Completion</p>
                                                <p className="text-lg font-semibold">
                                                    {new Date(response.estimationCompletionTime).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 font-medium">Customer Budget</p>
                                                <p className="text-lg font-semibold">
                                                    {response.customizationrequest.budget} LE
                                                </p>
                                            </div>
                                        </div>

                                        {response.notes && (
                                            <div className="mt-4">
                                                <p className="text-gray-500 font-medium">Your Notes</p>
                                                <p className="text-gray-800">{response.notes}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {activeMessageId && (
                    <div className="mt-10">
                        <Messages
                            responseId={activeMessageId}
                            onClose={() => setActiveMessageId(null)}
                        />
                    </div>
                )}
                {showReportModal && (
                    <div className="fixed inset-0 bg-white/50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-lg relative transition-all duration-300">
                            {reportSuccess ? (
                                <div className="text-center py-10">
                                    <h2 className="text-xl font-bold text-green-600 mb-3">✅ Report Submitted!</h2>
                                    <p className="text-gray-700">Thank you for helping us keep the community safe.</p>
                                </div>
                            ) : (
                                <>
                                    <button
                                        className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                                        onClick={() => setShowReportModal(false)}
                                    >
                                        ✕
                                    </button>
                                    <h3 className="text-xl font-semibold text-[#E07385] mb-4">Report @{reportingUsername}</h3>
                                    <textarea
                                        rows={4}
                                        placeholder="Describe the issue..."
                                        className="w-full border rounded-md p-2 text-sm hover:border-[#E07385] focus:outline-none focus:ring-2 focus:ring-[#E07385] transition"
                                        value={reportContent}
                                        onChange={(e) => setReportContent(e.target.value)}
                                    />
                                    <label className="block mb-4 mt-4">
                                        <span className="text-sm font-medium text-gray-700 block mb-1">Attach Screenshot (optional)</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => setAttachment(e.target.files[0])}
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white file:mr-4 file:py-2 file:px-4 file:border-0 file:text-sm file:bg-[#E07385]/10 file:text-[#921A40] hover:file:bg-[#E07385]/20 transition"
                                        />
                                        {attachment && (
                                            <p className="text-sm text-gray-600 mt-1">{attachment.name}</p>
                                        )}
                                    </label>
                                    <button
                                        onClick={handleReportSubmit}
                                        className="mt-4 bg-[#E07385] text-white px-4 py-2 rounded hover:bg-[#7a1635]"
                                    >
                                        Submit Report
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}


            </div>
        </>
    );
};

export default ArtistResponses;