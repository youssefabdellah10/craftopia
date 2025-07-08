import React, { useState, useEffect } from 'react';
import {
  Clock, Users, Gavel, Check, X, Eye, PoundSterling,
} from 'lucide-react';

const AdminAuctionManagement = () => {
  const [activeTab, setActiveTab] = useState('requests');
  const [pendingRequests, setPendingRequests] = useState([]);
  const [activeAuctions, setActiveAuctions] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [scheduledStartDate, setScheduledStartDate] = useState('');
  const [scheduledDuration, setScheduledDuration] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [artistMap, setArtistMap] = useState({});
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [errorRequests, setErrorRequests] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [todayBidCount, setTodayBidCount] = useState(0);
  const [zoomedImage, setZoomedImage] = useState(null);


  const formatEndDate = (dateStr) => {
  if (!dateStr) return 'Unknown';
  const date = new Date(dateStr);
  if (isNaN(date)) return 'Invalid date';
  return date.toLocaleString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

  const getAuthToken = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn("Authentication token not found in localStorage.");
    }
    return token;
  };

  const commonHeaders = () => {
    const token = getAuthToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  const fetchActiveAuctions = async () => {
  try {
    const response = await fetch('http://localhost:3000/auction', {
      headers: commonHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const { auctions } = await response.json();
    setActiveAuctions(auctions);
  } catch (err) {
    console.error("Failed to fetch active auctions:", err);
    setErrorRequests(`Failed to load active auctions: ${err.message}`);
  }
};


const fetchAuctionRequests = async () => {
  setLoadingRequests(true);
  setErrorRequests(null);
  try {
    const response = await fetch('http://localhost:3000/auctionRequest/all', {
      headers: commonHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    const pending = data.filter(req => req.status === 'pending');
    const active = data.filter(req =>
      req.status === 'scheduled' || req.status === 'active'
    );

    setPendingRequests(pending);
    setActiveAuctions(active);
  } catch (err) {
    console.error("Failed to fetch auction requests:", err);
    setErrorRequests(`Failed to load auction requests: ${err.message}.`);
  } finally {
    setLoadingRequests(false);
  }
};

const fetchArtists = async () => {
  try {
    const response = await fetch('http://localhost:3000/artist/all', {
      headers: commonHeaders(),
    });

    if (!response.ok) throw new Error('Failed to fetch artists');

    const data = await response.json();
    const map = {};

    data.artists.forEach(artist => {
      map[artist.artistId] = artist.name;
    });

    setArtistMap(map);
  } catch (err) {
    console.error('Error fetching artists:', err);
  }
};

const fetchTodayBids = async () => {
  try {
    const response = await fetch('http://localhost:3000/bid/today-bids', {
      headers: commonHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    setTodayBidCount(data.totalBids || 0);
  } catch (err) {
    console.error("Failed to fetch today's bids:", err);
    setTodayBidCount(0); 
  }
};

const refreshAuctions = async () => {
  await fetchAuctionRequests();
  await fetchActiveAuctions();
  await fetchTodayBids();
};

  useEffect(() => {
    fetchAuctionRequests();
    fetchActiveAuctions();
    fetchArtists();
    fetchTodayBids();
  }, []);

  useEffect(() => {
    if (selectedRequest) {
      setScheduledDuration(selectedRequest.duration ? String(selectedRequest.duration) : '');
      setScheduledStartDate('');
      setAdminNotes('');
      setFeedbackMessage('');
    }
  }, [selectedRequest]);

const handleApproveRequest = async () => {
  if (!selectedRequest || !scheduledStartDate) {
    setFeedbackMessage('Error: Please select a start date for the auction.');
    return;
  }

  const durationInDays = scheduledDuration
    ? parseInt(scheduledDuration)
    : selectedRequest.suggestedDuration;

  const requestId = selectedRequest.requestId;

  const [datePart, timePart] = scheduledStartDate.split('T');

  const approvalBody = {
    startDate: {
      date: datePart,
      time: timePart?.slice(0, 5), 
    },
    Duration: durationInDays * 24,
    adminNotes: adminNotes || "No notes provided.",
  };

  try {
    const response = await fetch(`http://localhost:3000/auctionRequest/schedule/${requestId}`, {
      method: 'POST',
      headers: commonHeaders(),
      body: JSON.stringify(approvalBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || response.statusText);
    }

    setFeedbackMessage('Auction request approved and scheduled.');
    setTimeout(() => setFeedbackMessage(''), 3000);
    setPendingRequests(prev => prev.filter(req => req.requestId !== requestId));
    setSelectedRequest(null);
    await refreshAuctions();
  } catch (err) {
    console.error("Error approving request:", err);
    setFeedbackMessage(`Error: ${err.message}`);
  }
};



const handleDeclineRequest = async () => {
  if (!selectedRequest) return;

  const requestId = selectedRequest.requestId;
  const declineBody = {
    adminNotes: adminNotes || "No notes provided.",
  };


  try {
    const response = await fetch(`http://localhost:3000/auctionRequest/reject/${requestId}`, {
      method: 'POST',
      headers: commonHeaders(),
      body: JSON.stringify(declineBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || response.statusText);
    }

    setFeedbackMessage('Auction request rejected.');
    setTimeout(() => setFeedbackMessage(''), 3000);
    setPendingRequests(prev => prev.filter(req => req.requestId !== requestId));
    setSelectedRequest(null);
    await refreshAuctions();
  } catch (err) {
    console.error("Error declining request:", err);
    setFeedbackMessage(`Error: ${err.message}`);
  }
};


const AuctionCard = ({ auction }) => (
  <div className="bg-white border border-coral/20 rounded-lg shadow-sm p-6">
    <div className="flex justify-between items-start">
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-coral mb-2">
          {auction.productDetails?.name || 'Untitled Product'}
        </h3>
        <p className="text-black/70 mb-2">
          by: {artistMap[auction.artistId] || `Artist #${auction.artistId}`}
        </p>

        <div className="flex flex-col gap-1 text-sm text-black/60">
          <div className="flex gap-4 items-center">
            <span className="inline-flex items-center gap-x-1 align-middle">
              Current bid:
              <PoundSterling className="h-3 w-3 inline-block" />
              {auction.currentPrice}
            </span>
            <span>•</span>
            <span>{auction.bidCount} bids</span>
          </div>
          <div className="flex gap-4 items-center">
            {auction.status === "scheduled" && auction.startDate && (
              <>
                <span>Starts: {formatEndDate(auction.startDate)}</span>
                <span>•</span>
              </>
            )}
            <span>Ends: {formatEndDate(auction.endDate)}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-end gap-2">
        <span className={`px-3 py-1 ${
          auction.status === 'active' ? 'bg-green-100 text-green-800' :
          auction.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
          auction.status === 'ended' ? 'bg-gray-200 text-gray-800' : ''
        } rounded-full text-sm font-medium capitalize`}>
          {auction.status}
        </span>
        <img
          src={auction.productDetails?.image?.[0] || "/fallback.jpg"}
          alt="Product"
          className="w-24 h-24 object-cover rounded-md"
        />
      </div>
    </div>
  </div>
);


  return (
    <div className="min-h-screen bg-cream m-5">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md::text-4xl font-bold text-black mb-4">Auction Management</h1>
          <p className="text-lg text-black/50">Manage auction requests and active auctions</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-coral/20 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-black/60 text-sm">Pending Requests</p>
                <p className="text-2xl font-bold text-black">{pendingRequests.length}</p>
              </div>
              <Clock className="h-8 w-8 text-coral" />
            </div>
          </div>
          <div className="bg-white border border-coral/20 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-black/60 text-sm">Active Auctions</p>
                <p className="text-2xl font-bold text-black">{activeAuctions.filter(auction => auction.status === 'active').length}</p>
              </div>
              <Gavel className="h-8 w-8 text-coral" />
            </div>
          </div>
          <div className="bg-white border border-coral/20 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-black/60 text-sm">Total Bids Today</p>
                <p className="text-2xl font-bold text-black">{todayBidCount}</p>
              </div>
              <Users className="h-8 w-8 text-coral" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="w-full">
          <div className="flex flex-wrap gap-2 mb-8 border-b border-coral/20">
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-4 py-2 font-medium text-sm transition-colors ${
                activeTab === 'requests'
                  ? 'text-burgundy border-b-2 border-burgundy'
                  : 'text-burgundy/60 hover:text-burgundy'
              }`}
            >
              Auction Requests
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`px-4 py-2 font-medium text-sm transition-colors ${
                activeTab === 'active'
                  ? 'text-burgundy border-b-2 border-burgundy'
                  : 'text-burgundy/60 hover:text-burgundy'
              }`}
            >
              Active Auctions
            </button>
            <button
              onClick={() => setActiveTab('scheduled')}
              className={`px-4 py-2 font-medium text-sm transition-colors ${
                activeTab === 'scheduled'
                  ? 'text-burgundy border-b-2 border-burgundy'
                  : 'text-burgundy/60 hover:text-burgundy'
              }`}
            >
              Scheduled Auctions
            </button>
            <button
              onClick={() => setActiveTab('ended')}
              className={`px-4 py-2 font-medium text-sm transition-colors ${
                activeTab === 'ended'
                  ? 'text-burgundy border-b-2 border-burgundy'
                  : 'text-burgundy/60 hover:text-burgundy'
              }`}
            >
              Ended Auctions
            </button>
          </div>

          {feedbackMessage && (
            <div className={`p-3 mb-4 rounded-md text-sm ${
              feedbackMessage.startsWith('Error') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
            }`}>
              {feedbackMessage}
            </div>
          )}

          {activeTab === 'requests' && (
            <div className="space-y-6">
              {loadingRequests && <p className="text-burgundy/70">Loading auction requests...</p>}
              {errorRequests && <p className="text-red-500">{errorRequests}</p>}
              {!loadingRequests && pendingRequests.length === 0 && !errorRequests && (
                <p className="text-burgundy/70">No pending auction requests.</p>
              )}
              <div className="grid gap-6">
                {pendingRequests.map((request) => {
                  const isExpanded = selectedRequest?.requestId === request.requestId;
                  const currentDuration = scheduledDuration || request.suggestedDuration;
                  return (
                    <div key={request.requestId}>
                    <div
                      key={request.requestId}
                      className="bg-white rounded-xl border border-gray-200 shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden"
                    >
                      <div className="p-6 flex flex-col md:flex-row justify-between gap-6">
                        {/* Product Info */}
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-900 mb-1">
                            {request.product?.name || 'Untitled Product'}
                          </h3>
                          <p className="text-sm text-gray-600 mb-3 font-medium">
                            by {request.artist?.name || 'Unknown Artist'}
                          </p>

                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="inline-flex items-center gap-x-1">
                              💰 Starting bid:
                              <PoundSterling className="h-4 w-4 inline-block" />
                              {request.startingPrice}
                            </span>

                            <span>•</span>
                            <span>⏳ Duration: {request.suggestedDuration} days</span>
                          </div>
                        </div>

                        {/* Review Button */}
                        <div className="flex items-start md:items-center">
                          <button
                            onClick={() =>
                              setSelectedRequest((prev) =>
                                prev?.requestId === request.requestId ? null : request
                              )
                            }
                            className="inline-flex items-center gap-2 bg-coral/20 hover:bg-coral/30 text-burgundy px-4 py-2 rounded-md text-sm font-medium transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                            {selectedRequest?.requestId === request.requestId ? 'Close' : 'Review'}
                          </button>
                        </div>
                      </div>

                      {/* Expanded Request Details */}
                      {selectedRequest?.requestId === request.requestId && (
                        <div className="bg-card/20 px-6 py-6 border-t border-gray-200">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Image + Info */}
                            <div>
                            <img
                              src={request.product?.image?.[0] || "/fallback.jpg"}
                              alt="Product"
                              onClick={() => setZoomedImage(request.product?.image?.[0])}
                              className="w-full h-60 object-cover rounded-lg shadow-sm mb-4 cursor-pointer hover:scale-105 transition-transform duration-300"
                            />

                              <div className="text-sm text-gray-700 space-y-1">
                                <p>
                                  <span className="font-medium">Materials:</span>{" "}
                                  {request.product?.material || 'N/A'}
                                </p>
                                <p>
                                  <span className="font-medium">Dimensions:</span>{" "}
                                  {request.product?.dimensions || 'N/A'}
                                </p>
                                <p>
                                  <span className="font-medium">Previous Sales:</span>{" "}
                                  {request.product?.totalSales || 0}
                                </p>
                                <p>
                                  <span className="font-medium">Artist Rating:</span>{" "}
                                  {request.artist?.averageRating || 'N/A'}/5
                                </p>
                                <p>
                                  <span className="font-medium">Description:</span>{" "}
                                  {request.product?.description || 'No description provided'}
                                </p>
                              </div>

                            </div>

                            {/* Admin Controls */}
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium text-gray-800 mb-1 block">
                                  Start Date & Time
                                </label>
                                <input
                                  type="datetime-local"
                                  value={scheduledStartDate}
                                  onChange={(e) => setScheduledStartDate(e.target.value)}
                                  className="w-full p-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                />
                              </div>

                              <div>
                                <label className="text-sm font-medium text-gray-800 mb-1 block">
                                  Duration (days)
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  value={scheduledDuration || request.suggestedDuration}
                                  onChange={(e) => setScheduledDuration(e.target.value)}
                                  className="w-full p-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                />
                              </div>

                              <div>
                                <label className="text-sm font-medium text-gray-800 mb-1 block">
                                  Admin Notes
                                </label>
                                <textarea
                                  rows="3"
                                  placeholder="Notes for the artist..."
                                  value={adminNotes}
                                  onChange={(e) => setAdminNotes(e.target.value)}
                                  className="w-full p-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                />
                              </div>

                              <div className="flex gap-3">
                                <button
                                  onClick={handleApproveRequest}
                                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-md font-medium transition-colors"
                                >
                                  <Check className="inline-block mr-2 h-4 w-4" />
                                  Approve
                                </button>
                                <button
                                  onClick={handleDeclineRequest}
                                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-md font-medium transition-colors"
                                >
                                  <X className="inline-block mr-2 h-4 w-4" />
                                  Decline
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'active' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-black">Active Auctions</h2>
              {activeAuctions.filter(auction => auction.status === 'active').length === 0 ? (
                <p className="text-burgundy/70">No active auctions to display.</p>
              ) : (
                <div className="grid gap-6">
                  {activeAuctions
                    .filter(auction => auction.status === 'active')
                    .map((auction) => (
                      <AuctionCard key={auction.id} auction={auction} />
                    ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'scheduled' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-black">Scheduled Auctions</h2>
              {activeAuctions.filter(auction => auction.status === 'scheduled').length === 0 ? (
                <p className="text-burgundy/70">No scheduled auctions to display.</p>
              ) : (
                <div className="grid gap-6">
                  {activeAuctions
                    .filter(auction => auction.status === 'scheduled')
                    .map((auction) => (
                      <AuctionCard key={auction.id} auction={auction} />
                    ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'ended' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-black">Ended Auctions</h2>
              {activeAuctions.filter(auction => auction.status === 'ended').length === 0 ? (
                <p className="text-burgundy/70">No ended auctions to display.</p>
              ) : (
                <div className="grid gap-6">
                  {activeAuctions
                    .filter(auction => auction.status === 'ended')
                    .map((auction) => (
                      <AuctionCard key={auction.id} auction={auction} />
                    ))}
                </div>
              )}
            </div>
          )}




        </div>
        </div>
        {zoomedImage && (
          <div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
            onClick={() => setZoomedImage(null)}
          >
            <img
              src={zoomedImage}
              alt="Zoomed Product"
              className="max-w-full max-h-full rounded-lg shadow-lg"
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking image
            />
          </div>
        )}

    </div>

  );
};

export default AdminAuctionManagement;

