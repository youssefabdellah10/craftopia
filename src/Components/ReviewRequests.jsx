import { useEffect, useState } from "react";
import { ChatBubbleOvalLeftIcon, XMarkIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/solid';
import { ArrowPathIcon } from "@heroicons/react/24/solid";
import ArtistResponses from "./ ArtistResponses";
import { motion } from "framer-motion";
import {toast} from "react-hot-toast";
const ReviewRequests = () => {
    const [requests, setRequests] = useState([]);
    const [error, setError] = useState(null);
    const [replyForms, setReplyForms] = useState({});
    const [showDetails, setShowDetails] = useState({});
    const [showResponses, setShowResponses] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await fetch("http://localhost:3000/customizationRequest/requests", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) throw new Error("Failed to fetch requests.");

                const data = await response.json();
                setRequests(data);
            } catch (err) {
                setError(err.message);
            }
        };

        fetchRequests();
    }, []);

    const toggleReplyForm = (id) => {
        setReplyForms(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                showForm: !prev[id]?.showForm
            }
        }));
    };

    const toggleDetails = (id) => {
        setShowDetails(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const handleInputChange = (id, field, value) => {
        setReplyForms(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                [field]: value
            }
        }));
    };

    const handleSubmitReply = async (requestId) => {
        const token = localStorage.getItem("token");
        const replyData = replyForms[requestId];

        if (!replyData || !replyData.price || !replyData.note || !replyData.estimationCompletionDate) {
            toast.error("Please fill in all required fields before submitting.");
            return;
        }

        try {
            const formData = new FormData();
            formData.append("price", replyData.price);
            formData.append("notes", replyData.note);
            formData.append("estimationCompletionDate", replyData.estimationCompletionDate);

            if (replyData.imageFile) {
                formData.append("image", replyData.imageFile);
            }

            const response = await fetch(`http://localhost:3000/customizationResponse/respond/${requestId}`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to submit response.");
            }

            toast.success("Response sent successfully!");
            setReplyForms(prev => ({
                ...prev,
                [requestId]: { ...prev[requestId], showForm: false }
            }));
        } catch (err) {
            toast.error("Error: " + err.message);
        }
    };
    <div className="flex justify-end mb-6">
        <button
            onClick={() => setShowResponses(prev => !prev)}
            className="flex items-center gap-2 bg-[#E07385] hover:bg-[#c26075] text-white font-semibold px-4 py-2 rounded transition"
        >
            <ArrowPathIcon className="w-5 h-5" />
            {showResponses ? "Show Customization Requests" : "Show My Offers"}
        </button>
    </div>


    return (
        <div className="max-w-5xl mx-auto px-6 py-8 bg-[#FAF9F6]">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-extrabold text-black border-b-4 border-[#E07385] pb-2">
                    {showResponses ? "My Customization Offers" : "Customization Requests"}
                </h2>
                <button
                    onClick={() => setShowResponses(prev => !prev)}
                    className="flex items-center gap-2 bg-[#E07385] hover:bg-[#c26075] text-white font-semibold px-4 py-2 rounded transition"
                >
                    {showResponses ? "Show Requests" : "Show My Offers"}
                </button>
            </div>

            {showResponses ? (
                <ArtistResponses />
            ) : (
                <>
                    {error && (
                        <p className="text-center text-red-600 font-semibold mb-6">{error}</p>
                    )}

                    {requests.length === 0 ? (
                        <div className="flex flex-col justify-center items-center h-72 bg-white/60 backdrop-blur-md border border-pink-300 rounded-2xl shadow-lg p-8 mx-4 text-center animate-fade-in transition-all duration-500">
                            <div className="bg-pink-100 p-4 rounded-full shadow-inner mb-4">
                                <svg
                                    className="w-16 h-16 text-[#921A40] animate-fade-in"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M9 2h6a1 1 0 011 1v1h2a1 1 0 011 1v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a1 1 0 011-1h2V3a1 1 0 011-1zm3 7v6m3-3H9"
                                    />
                                </svg>
                            </div>

                            <h2 className="text-2xl font-bold text-[#921A40] mb-2 drop-shadow">
                                No Customization Requests
                            </h2>
                            <p className="text-gray-600 text-sm max-w-xs">
                                You haven’t received any requests yet. When someone sends one, it’ll appear right here.
                            </p>
                        </div>
                    ) : (


                        <div className="flex flex-col gap-8">
                            {requests.map((request) => (
                                <div
                                    key={request.requestId}
                                    className="rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-4"
                                    style={{ backgroundColor: "#F6EEEE" }}
                                >
                                    <div className="flex flex-col md:flex-row gap-4">
                                        <motion.div
                                            className="md:w-1/6 relative bg-[#F6EEEE] p-5 rounded-2xl shadow-xl flex flex-col items-center justify-center border border-[#E07385]/30 overflow-hidden"
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ type: "spring", stiffness: 100, damping: 14 }}
                                        >


                                            <div className="text-5xl z-10 text-[#E07385] drop-shadow animate-bounce">
                                                📥
                                            </div>
                                            <p className="mt-3 text-base font-semibold text-[#921A40] z-10 tracking-wide">
                                                New Request
                                            </p>
                                        </motion.div>


                                        {request.image && (
                                            <div className="hidden md:flex items-center">
                                                <div className="h-20 w-px bg-black"></div>
                                            </div>
                                        )}
                                        {request.image && (
                                            <div className="md:w-1/5">
                                                <img
                                                    src={request.image}
                                                    alt="Custom Request"
                                                    className="w-full h-40 object-cover rounded-lg shadow"
                                                    loading="lazy"
                                                />
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center">
                                                <div className="mr-4">
                                                    <p className="font-semibold text-gray-500 text-lg mb-5">Product Title</p>
                                                    <h3 className="text-xl font-semibold text-black  pb-2">
                                                        {request.title || "Untitled Request"}
                                                    </h3>
                                                </div>
                                                <div className="mr-4">
                                                    <p className="font-semibold text-gray-500 text-lg mb-5">Product Budget</p>
                                                    <h3 className="text-xl font-semibold text-black pb-2">
                                                        💰{request.budget || "Untitled Request"} LE
                                                    </h3>
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <button
                                                        onClick={() => toggleReplyForm(request.requestId)}
                                                        className="px-4 py-2 bg-[#E07385] hover:bg-[#c26075] text-white font-semibold rounded transition flex items-center justify-center gap-2"
                                                    >
                                                        {replyForms[request.requestId]?.showForm ? (
                                                            <>
                                                                <XMarkIcon className="h-4 w-4" />
                                                                Cancel Offer
                                                            </>
                                                        ) : (
                                                            <>
                                                                <ChatBubbleOvalLeftIcon className="h-4 w-4" />
                                                                Submit an Offer
                                                            </>
                                                        )}
                                                    </button>

                                                    <button
                                                        onClick={() => toggleDetails(request.requestId)}
                                                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded transition flex items-center justify-center gap-2"
                                                    >
                                                        {showDetails[request.requestId] ? (
                                                            <>
                                                                <ChevronUpIcon className="h-4 w-4" />
                                                                Hide Details
                                                            </>
                                                        ) : (
                                                            <>
                                                                <ChevronDownIcon className="h-4 w-4" />
                                                                View Request Details
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>

                                            {showDetails[request.requestId] && (
                                                <div className="mt-4 p-4 bg-[#F6EEEE] border border-gray-300 rounded-lg shadow-sm space-y-3">
                                                    <p className="text-gray-800">
                                                    <span className="font-semibold text-[#E07385]">Description:</span>{" "}
                                                    {request.requestDescription}
                                                    </p>

                                                    <p className="text-gray-800">
                                                    <span className="font-semibold text-[#E07385]">Created At:</span>{" "}
                                                    {new Date(request.createdAt).toLocaleDateString("en-US", {
                                                        year: "numeric",
                                                        month: "long",
                                                        day: "numeric"
                                                    })}
                                                    </p>

                                                    <div className="text-gray-800">
                                                    <span className="font-semibold text-[#E07385]">Deadline:</span>{" "}
                                                    {request.deadline ? (
                                                        <span
                                                        className={`inline-block px-3 py-1 rounded-full text-sm font-semibold 
                                                            ${new Date(request.deadline) < new Date()
                                                            ? "bg-red-200 text-red-800"
                                                            : new Date(request.deadline) - new Date() < 2 * 24 * 60 * 60 * 1000
                                                            ? "bg-yellow-200 text-yellow-800"
                                                            : "bg-green-200 text-green-800"
                                                            }`}
                                                        >
                                                        {new Date(request.deadline).toLocaleDateString("en-US", {
                                                            year: "numeric",
                                                            month: "long",
                                                            day: "numeric"
                                                        })}
                                                        </span>
                                                    ) : (
                                                        "N/A"
                                                    )}
                                                    </div>
                                                </div>
                                            )}



                                            {replyForms[request.requestId]?.showForm && (
                                                <form
                                                    onSubmit={async (e) => {
                                                        e.preventDefault();
                                                        setIsSubmitting(true);
                                                        await handleSubmitReply(request.requestId);
                                                        setIsSubmitting(false);
                                                    }}
                                                    className="mt-6 space-y-6 bg-[#F6EEEE] p-6 rounded-xl shadow-lg border border-gray-200"
                                                >
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div>
                                                            <label className="block text-gray-700 font-semibold mb-1">
                                                                Price (LE): <span className="text-red-500">*</span>
                                                            </label>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                value={replyForms[request.requestId]?.price || ""}
                                                                onChange={(e) =>
                                                                    handleInputChange(request.requestId, "price", e.target.value)
                                                                }
                                                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#921A40]"
                                                                required
                                                            />
                                                        </div>

                                                        <div>
                                                            <label className="block text-gray-700 font-semibold mb-1">
                                                                Completion Date: <span className="text-red-500">*</span>
                                                            </label>
                                                            <input
                                                                type="date"
                                                                value={replyForms[request.requestId]?.estimationCompletionDate || ""}
                                                                onChange={(e) =>
                                                                    handleInputChange(request.requestId, "estimationCompletionDate", e.target.value)
                                                                }
                                                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#921A40]"
                                                                required
                                                            />
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="block text-gray-700 font-semibold mb-1">
                                                            Note: <span className="text-red-500">*</span>
                                                        </label>
                                                        <textarea
                                                            value={replyForms[request.requestId]?.note || ""}
                                                            onChange={(e) =>
                                                                handleInputChange(request.requestId, "note", e.target.value)
                                                            }
                                                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#921A40]"
                                                            rows={4}
                                                            required
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-gray-700 font-semibold mb-1">
                                                            Attach Image (optional):
                                                        </label>
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) =>
                                                                handleInputChange(request.requestId, "imageFile", e.target.files[0])
                                                            }
                                                            className="w-full border border-gray-300 rounded-lg px-4 py-2"
                                                        />
                                                    </div>

                                                    <button
                                                        type="submit"
                                                        className={`w-full bg-[#921A40] hover:bg-[#7e1533] text-white font-bold py-2 px-4 rounded-lg transition duration-300 ${isSubmitting ? "opacity-75 cursor-not-allowed" : ""
                                                            }`}
                                                        disabled={isSubmitting}
                                                    >
                                                        {isSubmitting ? "Uploading..." : "Submit Offer"}
                                                    </button>
                                                </form>
                                            )}

                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );

};

export default ReviewRequests;