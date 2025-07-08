import { useEffect, useState } from "react";
import { FaUserCircle } from "react-icons/fa";
import {toast} from "react-hot-toast";

const AdminReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("submitted");

  const fetchReports = async () => {
    setLoading(true);
    const endpoint =
      activeTab === "submitted"
        ? "http://localhost:3000/report/submitted"
        : "http://localhost:3000/report/reviewed";

    try {
      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const result = await response.json();
      if (result.success) {
        const formattedReports = result.data.map((report) => ({
          id: report.ReportId,
          title: `Report #${report.ReportId}`,
          description: report.content,
          reporterUsername: report.reporterusername,
          reportedUsername: report.reportedusername,
          status: report.status,
          image: report.attachmentUrl,
        }));

        setReports(formattedReports);
      } else {
        console.error("Failed to fetch reports:", result.message);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
    }
    setLoading(false);
  };

  const handleReview = async (id) => {
    try {
      const res = await fetch(`http://localhost:3000/report/review/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const result = await res.json();
      if (result.success) {
        fetchReports();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error marking as reviewed:", error);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [activeTab]);

  return (
    <div className="p-6 w-4/5 min-h-screen flex flex-col bg-[#FAF9F6] mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Customer Reports</h2>
        <div className="flex gap-3">
          {["submitted", "reviewed"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1 rounded-md text-sm font-semibold transition duration-200 ${
                activeTab === tab
                  ? "bg-[#E07385] text-white"
                  : "bg-white border border-[#E07385] text-[#E07385] hover:bg-[#f9d6dc] hover:text-[#A36361]"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {loading ? (
          <p className="text-center text-gray-500 mt-4">Loading reports...</p>
        ) : reports.length === 0 ? (
          <p className="text-center text-gray-600 mt-4 italic">
            No {activeTab} reports available.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-5 mt-4">
            {reports.map((report) => (
              <div
                key={report.id}
                className="bg-white border rounded-xl p-5 shadow-md hover:shadow-lg flex flex-col justify-between"
              >
                <div className="flex justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-[#E07385]">
                      {report.title}
                    </h3>
                    <p className="text-m text-gray-900 mt-2 leading-relaxed">
                      {report.description}
                    </p>
                  </div>

                  {report.image && (
                    <div className="w-32 h-32 flex-shrink-0">
                      <img
                        src={report.image}
                        alt="Attachment"
                        className="w-full h-full object-cover rounded-lg border"
                      />
                    </div>
                  )}
                </div>

                <div className="border-t mt-4 pt-3 flex justify-between items-center text-sm text-gray-700">
                  <div className="flex items-center gap-2">
                    <FaUserCircle className="text-[#E07385] text-lg" />
                    <span className="font-semibold text-gray-800">
                      Reported by:
                    </span>
                    <span className="font-medium">
                      {report.reporterUsername}
                    </span>
                  </div>

                  {report.status !== "reviewed" && activeTab === "submitted" && (
                    <button
                      onClick={() => handleReview(report.id)}
                      className="px-3 py-1 text-sm bg-[#E07385] text-white rounded-md hover:bg-[#cb5f70] transition"
                    >
                      Mark as Reviewed
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReports;
