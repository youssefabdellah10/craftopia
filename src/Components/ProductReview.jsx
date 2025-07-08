import { useEffect, useState } from "react";
import {toast} from "react-hot-toast";
import {
  Star,
  CheckCircle,
  Calendar,
  Pencil,
  Trash2,
  Save,
  X,
  Flag
} from "lucide-react";
import axios from "axios";
import { motion } from "framer-motion";

const decodeToken = () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const base64Payload = token.split(".")[1];
    const payload = JSON.parse(atob(base64Payload));
    return payload?.id || null;
  } catch {
    return null;
  }
};

const ProductReview = ({ productId, onStatsUpdate }) => {
  const [reviews, setReviews] = useState([]);
  const [newRating, setNewRating] = useState(0);
  const [newReview, setNewReview] = useState("");
  const [error, setError] = useState("");
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editText, setEditText] = useState("");
  const [reportingUsername, setReportingUsername] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportContent, setReportContent] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [reportSuccess, setReportSuccess] = useState(false);

  const userId = decodeToken();

  useEffect(() => {
    if (!productId) return;
    axios
      .get(`http://localhost:3000/review/getreview/${productId}`)
      .then((res) => {
        const { reviews, averageRating, totalReviews } = res.data;
        setReviews(Array.isArray(reviews) ? reviews : []);
        if (typeof onStatsUpdate === "function") {
          onStatsUpdate({ averageRating, totalReviews });
        }
      });
  }, [productId]);

  const renderStars = (rating) =>
    Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < Math.floor(rating) ? "text-yellow-400 fill-current" : "text-gray-300"
          }`}
      />
    ));

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:3000/review/deletereview/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setReviews((prev) => prev.filter((r) => r.reviewId !== id));
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const handleEditSubmit = async (id) => {
    if (editText.trim().length < 10 || editText.trim().length > 500) return;
    try {
      await axios.put(
        `http://localhost:3000/review/updatereview/${id}`,
        { review: editText },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setReviews((prev) =>
        prev.map((r) => (r.reviewId === id ? { ...r, review: editText } : r))
      );
      setEditingReviewId(null);
      setEditText("");
    } catch (err) {
      console.error("Edit failed", err);
    }
  };

  const handleSubmitReview = async () => {
    const token = localStorage.getItem("token");
    setError("");
    if (!token) return toast.error("Please login to submit a review.");
    if (!newRating) return setError("Please select a rating.");
    if (!newReview.trim()) return setError("Please write a review.");
    if (newReview.length < 10 || newReview.length > 500)
      return setError("Review must be between 10 and 500 characters.");

    try {
      await axios.post(
        "http://localhost:3000/review/create",
        {
          productId,
          rating: Number(newRating),
          review: newReview,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const res = await axios.get(
        `http://localhost:3000/review/getreview/${productId}`
      );
      const { reviews, totalReviews, averageRating } = res.data;
      setReviews(reviews);
      onStatsUpdate?.({ averageRating, totalReviews });
      setNewReview("");
      setNewRating(0);
    } catch (err) {
      const message = err?.response?.data?.message;
      if (message === "You have already reviewed this product") {
        setError("You have already submitted a review for this product.");
      } else {
        setError("Failed to submit. Please check your review and try again.");
      }
    }
  };

  const handleReportSubmit = async () => {
    if (!reportContent.trim()) return toast.error("Please enter a reason for the report.");
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("content", reportContent);
      if (attachment) formData.append("attachment", attachment);

      const res = await fetch(
        `http://localhost:3000/report/createReportUser/${reportingUsername}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );

      if (res.ok) {
        setReportSuccess(true);
        setTimeout(() => {
          setShowReportModal(false);
          setReportSuccess(false);
          setAttachment(null);
          setReportContent("");
        }, 3000);
      } else {
        const data = await res.json();
        toast.error(data.message || "Report submission failed.");
      }
    } catch (err) {
      toast.error("An error occurred while submitting the report.");
    }
  };

  return (
  <div className="space-y-10">
    <div className="space-y-6">
      {reviews.length === 0 ? (
        <div className="text-center py-12 text-coral italic text-lg border border-dashed border-coral rounded-xl bg-cream">
          <p>This product hasn't been reviewed yet. Be the first to share your experience!</p>
        </div>
      ) : (
        reviews.map((r) => {
          const isMine = r.customerId === userId;
          return (
            <div
              key={r.reviewId}
              className="border border-[#ab5a68] hover:border-[#c3576d] transition duration-200 rounded-xl p-5 bg-white relative"
            >
              <div className="flex gap-4 items-start">
                <div className="shrink-0 w-12 h-12 bg-[#FAE3E5] rounded-full flex items-center justify-center text-[#E07385] font-bold text-lg">
                  {r.customer?.username?.[0]?.toUpperCase() || "U"}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-semibold text-gray-800">{r.customer?.username}</h4>
                      <div className="flex items-center text-sm text-gray-500 gap-2 mt-0.5">
                        <Calendar className="w-4 h-4" />
                        {new Date(r.createdAt || Date.now()).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                        {r.verified && (
                          <span className="flex items-center text-green-600 ml-2">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Verified Purchase
                          </span>
                        )}
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      className="rounded-full bg-[#E07385] hover:bg-[#c85e6d] transition p-2"
                      onClick={() => {
                        setReportingUsername(r.customer?.username);
                        setShowReportModal(true);
                      }}
                      title="Report this review"
                    >
                      <Flag className="w-4 h-4 text-white" />
                    </motion.button>
                  </div>

                  <div className="flex mt-1">{renderStars(r.rating)}</div>

                  {editingReviewId === r.reviewId ? (
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full mt-3 p-3 border rounded-md bg-white text-sm"
                      rows={3}
                    />
                  ) : (
                    <p className="text-gray-700 mt-3">{r.review}</p>
                  )}
                </div>

                {isMine && (
                  <div className="ml-4 space-x-2 mt-1">
                    {editingReviewId === r.reviewId ? (
                      <>
                        <button onClick={() => handleEditSubmit(r.reviewId)} className="text-green-600 hover:text-green-800">
                          <Save className="w-5 h-5" />
                        </button>
                        <button onClick={() => { setEditingReviewId(null); setEditText(""); }} className="text-gray-500 hover:text-gray-700">
                          <X className="w-5 h-5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => { setEditingReviewId(r.reviewId); setEditText(r.review); }} className="text-blue-600 hover:text-blue-800">
                          <Pencil className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleDelete(r.reviewId)} className="text-red-600 hover:text-red-800">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>

    {showReportModal && (
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-2xl relative">
          {reportSuccess ? (
            <div className="text-center py-10">
              <h2 className="text-xl font-bold text-green-600 mb-3">
                ✅ Report Submitted!
              </h2>
              <p className="text-gray-700">
                Thank you for helping us keep the community safe.
              </p>
            </div>
          ) : (
            <>
              <button
                className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                onClick={() => setShowReportModal(false)}
              >
                ✕
              </button>
              <h3 className="text-lg font-semibold mb-3 text-[#E07385]">
                Report @{reportingUsername}'s review
              </h3>
              <textarea
                rows={4}
                placeholder="Describe the issue..."
                className="w-full border rounded-md p-2 text-sm hover:border-[#E07385] focus:ring-[#E07385] focus:ring-1 outline-none"
                value={reportContent}
                onChange={(e) => setReportContent(e.target.value)}
              />

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Attach Screenshot (optional)
                </label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer inline-block px-4 py-2 bg-[#FCEEEF] text-[#E07385] rounded-md border border-[#F5C1C8] hover:bg-[#fddce3] transition text-sm font-medium">
                    Choose File
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setAttachment(e.target.files[0])}
                      className="hidden"
                    />
                  </label>
                  {attachment && (
                    <span className="text-sm text-gray-700 truncate max-w-[180px]">
                      {attachment.name}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={handleReportSubmit}
                className="mt-4 w-full bg-[#E07385] text-white py-2 rounded-md hover:bg-[#c85e6d]"
              >
                Submit Report
              </button>
            </>
          )}
        </div>
      </div>
    )}
  </div>
);

};

export default ProductReview;
