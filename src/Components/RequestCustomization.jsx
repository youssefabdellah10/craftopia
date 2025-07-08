
import { useState, useEffect, useRef } from "react";
import { Palette, Brush, Smile, Plus, Sparkle, Upload } from "lucide-react";
import { EnvelopeIcon } from "@heroicons/react/24/solid";
import { motion } from "framer-motion";
import Messages from "./Messages";
import {toast} from "react-hot-toast";

const RequestCustomization = () => {
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        budget: "",
        deadline: "",
        image: null,
    });

    const [preview, setPreview] = useState(null);
    const [message, setMessage] = useState(null);
    const [replies, setReplies] = useState([]);
    const [requests, setRequests] = useState([]);
    const [groupedReplies, setGroupedReplies] = useState({});
    const fileInputRef = useRef(null);
    const [showForm, setShowForm] = useState(false);
    const [expandedRequestIds, setExpandedRequestIds] = useState([]);
    const [loading, setLoading] = useState(false);
    const [openChatId, setOpenChatId] = useState(null);
    const [unreadMessages, setUnreadMessages] = useState([]);
    const [newMessageNotification, setNewMessageNotification] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem("token");
            try {
                const requestsRes = await fetch("http://localhost:3000/customizationRequest/noOffers", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!requestsRes.ok) throw new Error("Failed to fetch requests.");
                const requestsData = await requestsRes.json();
                setRequests(requestsData);
                const repliesRes = await fetch("http://localhost:3000/customizationResponse/responses", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!repliesRes.ok) throw new Error("Failed to fetch replies.");
                const repliesData = await repliesRes.json();

                if (!repliesData.responses || !Array.isArray(repliesData.responses)) {
                    throw new Error("Invalid response format from server");
                }

                setReplies(repliesData.responses);
                const grouped = repliesData.responses.reduce((acc, reply) => {
                    const requestId = reply.requestId;
                    if (!acc[requestId]) acc[requestId] = [];
                    acc[requestId].push(reply);
                    return acc;
                }, {});
                setGroupedReplies(grouped);

                const messagesRes = await fetch("http://localhost:3000/msg/unread", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!messagesRes.ok) throw new Error("Failed to fetch unread messages.");

                const messagesData = await messagesRes.json();
                setUnreadMessages(messagesData.data.unreadMessages || []);

            } catch (error) {
                console.error("Error fetching data:", error);
                setGroupedReplies({});
                setUnreadMessages([]);
                setRequests([]);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [openChatId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({ ...prev, image: file }));
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);
        setLoading(true);

        const form = new FormData();
        form.append("title", formData.title);
        form.append("description", formData.description);
        form.append("budget", formData.budget);
        form.append("deadline", formData.deadline);
        form.append("image", formData.image);

        const token = localStorage.getItem("token");

        try {
            const response = await fetch("http://localhost:3000/customizationRequest/request", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: form,
            });

            if (!response.ok) throw new Error("Failed to send request.");
            const data = await response.json();

            setMessage("Request submitted successfully!");
            setFormData({ title: "", description: "", budget: "", deadline: "", image: null });
            setPreview(null);
        } catch (error) {
            console.error(error);
            setMessage("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (unreadMessages.length > 0) {
            const latestMessage = unreadMessages[unreadMessages.length - 1];
            const reply = replies.find(r => r.responseId === latestMessage.responseId);
            if (reply) {
                setNewMessageNotification({
                    artist: reply.artist?.username || "An artist",
                    request: reply.customizationrequest?.title || "your request"
                });

                const timer = setTimeout(() => {
                    setNewMessageNotification(null);
                }, 5000);

                return () => clearTimeout(timer);
            }
        }
    }, [unreadMessages, replies]);

    const toggleRequest = (requestId) => {
        setExpandedRequestIds(prev =>
            prev.includes(requestId)
                ? prev.filter(id => id !== requestId)
                : [...prev, requestId]
        );
    };

    const updateReplyStatus = async (replyId, action) => {
        const token = localStorage.getItem("token");
        try {
            const response = await fetch(
                `http://localhost:3000/customizationResponse/${action}/${replyId}`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (!response.ok) throw new Error(`Failed to ${action} reply.`);
            const res = await fetch("http://localhost:3000/customizationResponse/responses", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();

            setReplies(data.responses || []);
            const grouped = (data.responses || []).reduce((acc, reply) => {
                const requestId = reply.requestId;
                if (!acc[requestId]) acc[requestId] = [];
                acc[requestId].push(reply);
                return acc;
            }, {});
            setGroupedReplies(grouped);

            if (action === 'accept') {
                setOpenChatId(replyId);
                toast.success("Offer accepted successfully!");
            } else {
                toast.success("Offer declined successfully!");
            }
        } catch (error) {
            console.error(error);
            toast.error(`Error ${action}ing offer: ${error.message}`);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "Not specified";
        const date = new Date(dateString);
        return isNaN(date.getTime())
            ? "Invalid date"
            : date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
    };

    const getStatusBadge = (status) => {
        const statusStyles = {
            PENDING: "bg-yellow-100 text-yellow-800",
            ACCEPTED: "bg-green-100 text-green-800",
            DECLINED: "bg-red-100 text-red-800",
            NO_OFFERS: "bg-blue-100 text-blue-800"
        };


        return (
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusStyles[status]}`}>
                {status}
            </span>
        );
    };

    const getUnreadCount = (responseId) => {
        return unreadMessages.filter(msg => msg.responseId === responseId).length;
    };

    const hasUnreadMessages = (responseId) => {
        return unreadMessages.some(msg => msg.responseId === responseId);
    };

    return (
        <div className="max-w-5xl bg-[#FAF9F6] p-8 rounded-3xl relative">
            {newMessageNotification && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="fixed bottom-6 right-6 z-50"
                    onClick={() => {
                        const reply = replies.find(r =>
                            r.artist?.username === newMessageNotification.artist &&
                            r.customizationrequest?.title === newMessageNotification.request
                        );
                        if (reply) setOpenChatId(reply.responseId);
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
                                                {getUnreadCount(replies.find(r =>
                                                    r.artist?.username === newMessageNotification.artist &&
                                                    r.customizationrequest?.title === newMessageNotification.request
                                                )?.responseId)}
                                            </span>
                                        </motion.div>
                                    </div>
                                </motion.div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-lg font-bold text-[#921A40]">New Message Alert!</h3>
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
                                        <span className="font-semibold text-[#E07385]">{newMessageNotification.artist}</span> sent you a new message
                                    </p>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Regarding your request: <span className="font-medium">"{newMessageNotification.request}"</span>
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

            {openChatId && (
                <Messages
                    responseId={openChatId}
                    onClose={() => setOpenChatId(null)}
                />
            )}


            {!showForm ? (
                <>
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-4xl font-extrabold text-[black] tracking-wide">
                            🎨 Artist Offers
                        </h2>
                        <button
                            onClick={() => setShowForm(true)}
                            className="bg-[#E07385] text-white px-6 py-3 rounded-full font-semibold hover:bg-[#c75d70] shadow-md transition duration-300 flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            Add New Request
                        </button>
                    </div>

                    <div className="bg-[#FAF9F6] p-6 rounded-2xl shadow-md max-w-5xl ml-0 mr-auto space-y-6">
                        {Object.keys(groupedReplies).length === 0 && requests.length === 0 ? (
                            <div className="relative text-center py-16 px-6 bg-gradient-to-br from-[#FFF5F7] to-[#FFF] rounded-xl border-2 border-dashed border-[#E07385]/30 overflow-hidden">
                                <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full bg-[#F8E8EB]/50 blur-xl"></div>
                                <div className="absolute -bottom-8 -right-8 w-40 h-40 rounded-full bg-[#F8E8EB]/30 blur-xl"></div>
                                <div className="relative z-10">
                                    <div className="mx-auto w-28 h-28 bg-gradient-to-br from-[#F8E8EB] to-[#FFF] rounded-full flex items-center justify-center mb-6 shadow-lg animate-float">
                                        <Palette className="w-14 h-14 text-[#E07385]" strokeWidth={1.5} />
                                    </div>

                                    <h3 className="text-3xl font-bold text-gray-800 mb-4 bg-clip-text text-transparent bg-gradient-to-r from-[#E07385] to-[#921A40]">
                                        Ready for Something Unique?
                                    </h3>

                                    <p className="text-gray-600 max-w-lg mx-auto mb-8 text-lg leading-relaxed">
                                        Your personalized creations await! Start by sharing your vision and our artists will bring it to life.
                                    </p>

                                    <div className="flex flex-wrap justify-center gap-6 mb-10">
                                        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-[#E07385]/20">
                                            <Brush className="w-5 h-5 text-[#E07385]" />
                                            <span className="text-sm font-medium text-gray-700">100% Custom</span>
                                        </div>
                                        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-[#E07385]/20">
                                            <Smile className="w-5 h-5 text-[#E07385]" />
                                            <span className="text-sm font-medium text-gray-700">Handcrafted</span>
                                        </div>
                                        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-[#E07385]/20">
                                            <Sparkle className="w-5 h-5 text-[#E07385]" />
                                            <span className="text-sm font-medium text-gray-700">Unique Designs</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setShowForm(true)}
                                        className="relative overflow-hidden group mt-4 bg-[#e07385] text-white px-8 py-4 rounded-full font-semibold hover:shadow-xl transition-all duration-300 flex items-center mx-auto"
                                    >
                                        <span className="relative z-10 flex items-center">
                                            <Plus className="w-6 h-6 mr-3" />
                                            <span className="text-lg">Start Your Creative Journey</span>
                                        </span>
                                        <span className="absolute inset-0 bg-[#921A40] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                {Object.keys(groupedReplies).length > 0 && Object.entries(groupedReplies).map(([requestId, replies]) => {
                                    const firstReply = replies[0];
                                    const request = firstReply.customizationrequest || {};

                                    return (
                                        <div
                                            key={requestId}
                                            className="border border-[#E07385]/40 rounded-xl p-5 bg-[#F6EEEE] shadow-sm hover:shadow-md transition-all duration-300"
                                        >
                                            <div
                                                className="flex items-center justify-between cursor-pointer"
                                                onClick={() => toggleRequest(requestId)}
                                            >
                                                <div className="flex items-center gap-4">
                                                    {request.image && (
                                                        <img
                                                            src={request.image}
                                                            alt="Request"
                                                            className="w-20 h-20 object-cover rounded-lg border border-[#E07385]/30 shadow-sm"
                                                        />
                                                    )}
                                                    <div>
                                                        <p className="text-xl font-semibold text-[black]">
                                                            🛍️ {request.title || "Unknown Product"}
                                                        </p>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-l text-gray-500">
                                                                {replies.length} {replies.length === 1 ? "offer" : "offers"} available
                                                            </p>
                                                            {replies.some(r => r.status === 'ACCEPTED') && (
                                                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
                                                                    Accepted
                                                                </span>
                                                            )}
                                                            {replies.some(r => r.status === 'ACCEPTED' && hasUnreadMessages(r.responseId)) && (
                                                                <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-semibold animate-pulse">
                                                                    New Messages!
                                                                </span>
                                                            )}
                                                            {replies.some(r => r.status === 'ACCEPTED' && getUnreadCount(r.responseId) > 0) && (
                                                                <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-semibold animate-pulse">
                                                                    {replies.reduce((total, r) => total + (r.status === 'ACCEPTED' ? getUnreadCount(r.responseId) : 0), 0)} New Messages
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className="text-2xl text-[#E07385] font-bold">
                                                    {expandedRequestIds.includes(requestId) ? "▲" : "▼"}
                                                </span>
                                            </div>

                                            {expandedRequestIds.includes(requestId) && (
                                                <div className="mt-4 pt-4 space-y-6">
                                                    {replies.map((reply) => (
                                                        <div
                                                            key={reply.responseId}
                                                            className={`p-4 rounded-lg border border-gray-200 ${reply.status === 'ACCEPTED' ? 'bg-[white]' : 'bg-white'}`}
                                                        >
                                                            <div className="flex items-center justify-between gap-4 mb-3">
                                                                <div className="flex items-center gap-3">
                                                                    {reply.artist?.profilePicture && (
                                                                        <img
                                                                            src={reply.artist.profilePicture}
                                                                            alt="Artist"
                                                                            className="w-12 h-12 rounded-full object-cover"
                                                                        />
                                                                    )}
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-lg font-semibold text-black">
                                                                            {reply.artist?.username || "Unknown Artist"}
                                                                        </span>
                                                                        {getStatusBadge(reply.status)}
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-4 relative">
                                                                    <span className="text-xl font-bold text-[#921A40]">
                                                                        {reply.price} LE
                                                                    </span>

                                                                    {reply.status === "ACCEPTED" && (
                                                                        <motion.div
                                                                            whileHover={{ scale: 1.1 }}
                                                                            whileTap={{ scale: 0.95 }}
                                                                            onClick={() => setOpenChatId(reply.responseId)}
                                                                            className="relative cursor-pointer"
                                                                            title="Message artist"
                                                                        >
                                                                            <div className="relative">
                                                                                <EnvelopeIcon className="h-6 w-6 text-[#E07385] hover:text-[#921A40] transition-colors" />
                                                                                {getUnreadCount(reply.responseId) > 0 && (
                                                                                    <motion.span
                                                                                        className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center"
                                                                                        initial={{ scale: 0 }}
                                                                                        animate={{ scale: 1 }}
                                                                                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                                                                    >
                                                                                        {getUnreadCount(reply.responseId)}
                                                                                    </motion.span>
                                                                                )}
                                                                            </div>
                                                                        </motion.div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {reply.notes && (
                                                                <p className="text-gray-700 mb-3">
                                                                    <strong className="text-[#E07385]">Note:</strong> {reply.notes}
                                                                </p>
                                                            )}

                                                            <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                                                                <p>
                                                                    <strong className="text-[#E07385]">EstimationCompletionTime</strong>{" "}
                                                                    {formatDate(reply.estimationCompletionTime)}
                                                                </p>
                                                                <p className="text-right text-gray-500">
                                                                    Offered on: {formatDate(reply.createdAt)}
                                                                </p>
                                                            </div>

                                                            {reply.image && (
                                                                <div className="mb-5">
                                                                    <div className="inline-block bg-[#E07385]/10 text-[#E07385] px-4 py-2 rounded-full text-sm font-semibold mb-3">
                                                                        🎨 Artist's Proposal
                                                                    </div>
                                                                    <img
                                                                        src={reply.image}
                                                                        alt="Reply Image"
                                                                        className="w-50 h-50 object-cover rounded-2xl shadow-lg border border-[#E07385]/30 transition-transform duration-300 hover:scale-105"
                                                                    />
                                                                </div>
                                                            )}


                                                            <div className="flex justify-end gap-4 mt-4">
                                                                {reply.status === 'PENDING' ? (
                                                                    <>
                                                                        <button
                                                                            onClick={() => updateReplyStatus(reply.responseId, 'decline')}
                                                                            className="bg-gray-600 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-gray-700 transition"
                                                                        >
                                                                            Decline
                                                                        </button>
                                                                        <button
                                                                            onClick={() => updateReplyStatus(reply.responseId, 'accept')}
                                                                            className="bg-[#e07385] text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-[#c26075] transition"
                                                                        >
                                                                            Accept
                                                                        </button>
                                                                    </>
                                                                ) : (
                                                                    <div className="text-sm italic text-gray-500">
                                                                        {reply.status === 'ACCEPTED' ?
                                                                            "You've accepted this offer" :
                                                                            "You've declined this offer"}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                                {requests.length > 0 && requests.map(request => (
                                    !groupedReplies[request.requestId] && (
                                        <div
                                            key={request.requestId}
                                            className="border border-[#E07385]/40 rounded-xl p-5 bg-[#F6EEEE] shadow-sm hover:shadow-md transition-all duration-300"
                                        >
                                            <div
                                                className="flex items-center justify-between cursor-pointer"
                                                onClick={() => toggleRequest(request.requestId)}
                                            >
                                                <div className="flex items-center gap-4">
                                                    {request.image && (
                                                        <img
                                                            src={request.image}
                                                            alt="Request"
                                                            className="w-20 h-20 object-cover rounded-lg border border-[#E07385]/30 shadow-sm"
                                                        />
                                                    )}
                                                    <div>
                                                        <p className="text-xl font-semibold text-[black]">
                                                            🛍️ {request.title || "Unknown Product"}
                                                        </p>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-l text-gray-500">
                                                                No offers yet
                                                            </p>
                                                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-semibold">
                                                                NO_OFFERS
                                                            </span>
                                                        </div>

                                                    </div>
                                                </div>
                                                <span className="text-2xl text-[#E07385] font-bold">
                                                    {expandedRequestIds.includes(request.requestId) ? "▲" : "▼"}
                                                </span>
                                            </div>

                                            {expandedRequestIds.includes(request.requestId) && (
                                                <div className="mt-4 pt-6 border-t border-[#E07385]/30 transition-all duration-500 ease-in-out">
                                                    <div className="p-6 rounded-3xl border border-[#f3c7ce] bg-gradient-to-br from-white to-[#fff6f8] shadow-xl hover:shadow-2xl transition-shadow duration-300">

                                                        {/* Header */}
                                                        <div className="flex items-center justify-between gap-4 mb-5">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-12 h-12 rounded-full bg-[#fcebed] flex items-center justify-center shadow-inner">
                                                                    <Palette className="w-6 h-6 text-[#E07385]" />
                                                                </div>
                                                                <h3 className="text-lg sm:text-xl font-bold text-[#921A40] tracking-wide">
                                                                    🎨 Waiting for Artists
                                                                </h3>
                                                            </div>
                                                            <span className="text-xl font-bold text-[#E07385] bg-[#fcebed] px-4 py-2 rounded-full shadow">
                                                                {request.budget} LE
                                                            </span>
                                                        </div>
                                                        <div className="text-sm sm:text-base text-center space-y-3 text-[#7a162e]">
                                                            <p className="bg-[#fff0f3] border border-[#f3c7ce] px-4 py-3 rounded-lg font-medium shadow-sm">
                                                                ⏳ This request is currently waiting for artist responses.
                                                            </p>
                                                            <p className="text-gray-600 font-semibold">
                                                                📅 <span className="text-[#E07385]">Deadline:</span> {formatDate(request.deadline)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}



                                        </div>
                                    )
                                ))}
                            </>
                        )}
                    </div>
                </>
            ) : (
                <>
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-3xl font-bold text-[black]">
                            Tell Us What You Need
                        </h2>
                        <button
                            onClick={() => setShowForm(false)}
                            className="text-white bg-[#E07385] hover:bg-[#921A40] font-medium transition px-4 py-2 rounded-lg"
                        >
                            Back to Offers
                        </button>
                    </div>

                    {message && (
                        <p className={`mb-6 text-center text-lg font-semibold ${message.includes("success") ? "text-green-600" : "text-[#E07385] animate-pulse"}`}>
                            {message}
                        </p>
                    )}

                    <div className="grid md:grid-cols-2 gap-10 bg-white p-8 rounded-2xl shadow-xl border border-[#f9d2d9] max-w-6xl mx-auto">
                        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                            <div>
                                <label className="block font-semibold text-sm text-[#7a162e] mb-2">
                                    Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    placeholder="Enter title"
                                    required
                                    className="w-full px-4 py-3 border border-[#f3c7ce] rounded-lg text-gray-700 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#E07385]"
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
                                    placeholder="Enter description"
                                    required
                                    className="w-full px-4 py-3 border border-[#f3c7ce] rounded-lg text-gray-700 placeholder-gray-400 shadow-sm resize-none h-32 focus:outline-none focus:ring-2 focus:ring-[#E07385]"
                                />
                            </div>

                            <div>
                                <label className="block font-semibold text-sm text-[#7a162e] mb-2">
                                    Budget (LE) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    name="budget"
                                    value={formData.budget}
                                    onChange={handleChange}
                                    placeholder="Enter your budget"
                                    required
                                    className="w-full px-4 py-3 border border-[#f3c7ce] rounded-lg text-gray-700 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#E07385]"
                                />
                            </div>

                            <div>
                                <label className="block font-semibold text-sm text-[#7a162e] mb-2">
                                    Deadline <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    name="deadline"
                                    value={formData.deadline}
                                    onChange={handleChange}
                                    required
                                    min={new Date().toISOString().split('T')[0]}
                                    className="w-full px-4 py-3 border border-[#f3c7ce] rounded-lg text-gray-700 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#E07385]"
                                />
                            </div>

                            <div className="mt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-[#E07385] text-white py-3 px-8 rounded-lg font-semibold hover:bg-[#7a162e] transition disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {loading ? "Uploading..." : "📩 Submit Request"}
                                </button>
                            </div>
                        </form>
                        <div className="flex flex-col gap-5">
                            <label className="font-semibold text-sm text-[#7a162e]">
                                Upload Your Design <span className="text-red-500">*</span>
                            </label>

                            <div className="relative border-4 border-dashed border-[#E07385] rounded-xl p-6 text-center bg-[#fff0f3] hover:bg-[#ffe6eb] transition cursor-pointer">
                                <input
                                    type="file"
                                    accept="image/*"
                                    ref={fileInputRef}
                                    onChange={handleImageChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    required
                                />
                                <div className="relative z-0 flex flex-col items-center justify-center pointer-events-none">
                                    <Upload className="h-8 w-8 text-[#E07385] mb-2" />
                                    <p className="text-[#7a162e] font-medium">
                                        Click or drag to upload your design
                                    </p>
                                </div>
                            </div>

                            {preview && (
                                <div className="flex justify-center mt-4">
                                    <img
                                        src={preview}
                                        alt="Preview"
                                        className="w-40 h-40 object-contain rounded-lg border border-[#E07385] shadow-md"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default RequestCustomization;