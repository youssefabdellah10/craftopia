import React, { useState, useEffect, useRef } from 'react';
import { Camera, ChevronDown, Settings, Upload, Edit, Trash2, Package, PoundSterling, Users, Star, Clock, Plus, Menu, ShoppingCart, User, Heart, Search, Gavel, AlertCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';



const AuctionRequest = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddProductForm, setShowAddProductForm] = useState(false);
  const [showAuctionRequestForm, setShowAuctionRequestForm] = useState(false);
  const navigate = useNavigate();
  const [visibleCount, setVisibleCount] = useState(5);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');


  const [auctionFormData, setAuctionFormData] = useState({
    title: '',
    category: '',
    startingBid: '',
    description: '',
    materials: '',
    dimensions: '',
    notes: '',
    duration: '7',
    type: 'auction',
    images: [],
  });

  const [auctionRequests, setAuctionRequests] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [error, setError] = useState(null);
  const [categoriesError, setCategoriesError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const fileInputRef = useRef(null);

  // Helper function to get the auth token
  const getAuthToken = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('Authentication token not found in localStorage. Please log in.');
    }
    return token;
  };

  const fetchArtistAuctionRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found. Please log in to view auction requests.');
      }

      const response = await fetch('http://localhost:3000/auctionRequest/my-requests', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch auction requests');
      }
      const data = await response.json();
      setAuctionRequests(data);
    } catch (err) {
      console.error('Error fetching auction requests:', err);
      setError(err.message || 'Failed to load auction requests.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    setLoadingCategories(true);
    setCategoriesError(null);
    try {
      const response = await fetch('http://localhost:3000/category/all');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch categories.');
      }
      const data = await response.json();
      setCategoriesList(data.categories || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setCategoriesError(err.message || 'Failed to load categories.');
    } finally {
      setLoadingCategories(false);
    }
  };


  useEffect(() => {
    fetchArtistAuctionRequests();
    fetchCategories();
  }, []);

  const handleShipAuctionProduct = async (auctionId) => {
    const token = getAuthToken();
    if (!token) {
      setError('You must be logged in to perform this action.');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/order/shipment-auction/${auctionId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create shipment.');
      }

      setSuccessMessage('Shipment created successfully!');
      fetchArtistAuctionRequests();
    } catch (error) {
      console.error('Error creating shipment:', error);
      setError(error.message || 'Something went wrong.');
    }
  };

  // --- Handle Form Input Changes ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAuctionFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + auctionFormData.images.length > 5) {
      setError('You can only upload a maximum of 5 images.');
      return;
    }
    setAuctionFormData(prev => ({ ...prev, images: [...prev.images, ...files] }));
    setError(null);
  };

  const handleRemoveImage = (index) => {
    setAuctionFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  // --- Handle Auction Request Submission ---
  const handleAuctionRequestSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    // Detailed frontend validation
    const errors = [];
    const {
      title,
      category,
      startingBid,
      description,
      materials,
      dimensions,
      notes,
      duration,
      images,
    } = auctionFormData;

    if (!title.trim()) errors.push('Item title is required.');
    if (!category.trim()) errors.push('Category is required.');
    if (!description.trim()) errors.push('Description is required.');
    if (!startingBid || isNaN(startingBid) || Number(startingBid) <= 0) errors.push('Valid starting bid is required.');
    if (!duration) errors.push('Auction duration is required.');
    if (!materials.trim()) errors.push('Materials are required.');
    if (!dimensions.trim()) errors.push('Dimensions are required.');
    if (images.length < 1 || images.length > 5) errors.push('Please upload between 1 and 5 images.');

    if (errors.length > 0) {
      setError(errors.join('\n'));
      setLoading(false);
      return;
    }

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found. Please log in before submitting an auction request.');
      }

      // Step 1: Create Product
      const productFormData = new FormData();
      productFormData.append('name', title);
      productFormData.append('description', description);
      productFormData.append('price', startingBid);
      productFormData.append('categoryName', category);
      productFormData.append('quantity', 1);
      productFormData.append('dimension', dimensions);
      productFormData.append('material', materials);
      productFormData.append('type', 'auction');
      images.forEach((file) => {
        productFormData.append('image', file);
      });

      const productResponse = await fetch('http://localhost:3000/product/create', {
        method: 'POST',
        body: productFormData,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!productResponse.ok) {
        const errorData = await productResponse.json();
        throw new Error(errorData.message || 'Failed to create product.');
      }

      const productResult = await productResponse.json();
      const productId = productResult.product.productId;

      // Step 2: Create Auction Request
      const auctionRequestPayload = {
        productId,
        startingPrice: parseFloat(startingBid),
        Duration: parseInt(duration),
        notes: notes || '',
      };

      const auctionResponse = await fetch('http://localhost:3000/auctionRequest/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(auctionRequestPayload),
      });

      if (!auctionResponse.ok) {
        const errorData = await auctionResponse.json();
        throw new Error(errorData.message || 'Failed to create auction request.');
      }

      setSuccessMessage('Auction request submitted successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
      setAuctionFormData({
        title: '',
        category: '',
        startingBid: '',
        description: '',
        materials: '',
        dimensions: '',
        notes: '',
        duration: '7',
        images: [],
      });
      setShowAuctionRequestForm(false);
      fetchArtistAuctionRequests();
    } catch (err) {
      console.error('Submission error:', err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };


  const getStatusClasses = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 ring-1 ring-yellow-300';
      case 'scheduled':
        return 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300';
      case 'active':
        return 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-300';
      case 'ended':
        return 'bg-red-100 text-red-700 ring-1 ring-red-300';
      default:
        return 'bg-gray-100 text-gray-700 ring-1 ring-gray-300';
    }
  };


  const filteredRequests = auctionRequests
    .filter(request => {
      const matchesStatus =
        statusFilter === 'all' ||
        request.status === statusFilter ||
        request.auction?.status === statusFilter;
      return matchesStatus;
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return dateFilter === 'oldest' ? dateA - dateB : dateB - dateA;
    });

  const visibleRequests = filteredRequests.slice(0, visibleCount);



  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-black">Auction Requests</h2>
          <button
            onClick={() => setShowAuctionRequestForm(true)}
            className="inline-flex items-center gap-2 bg-coral hover:bg-coral/90 text-cream px-4 py-2 rounded-md font-medium transition-colors"
          >
            <Gavel className="h-4 w-4" />
            Request Auction
          </button>
        </div>

        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Success!</strong>
            <span className="block sm:inline"> {successMessage}</span>
            <span className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => setSuccessMessage(null)}>
              <svg className="fill-current h-6 w-6 text-green-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.103l-2.651 3.746a1.2 1.2 0 1 1-1.697-1.697l3.746-2.651-3.746-2.651a1.2 1.2 0 1 1 1.697-1.697L10 8.897l2.651-3.746a1.2 1.2 0 0 1 1.697 1.697L11.103 10l3.746 2.651a1.2 1.2 0 0 1 0 1.698z" /></svg>
            </span>
          </div>
        )}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline"> {error}</span>
            <span className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => setError(null)}>
              <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.103l-2.651 3.746a1.2 1.2 0 1 1-1.697-1.697l3.746-2.651-3.746-2.651a1.2 1.2 0 1 1 1.697-1.697L10 8.897l2.651-3.746a1.2 1.2 0 0 1 1.697 1.697L11.103 10l3.746 2.651a1.2 1.2 0 0 1 0 1.698z" /></svg>
            </span>
          </div>
        )}

        {showAuctionRequestForm && (
          <div className="bg-white border border-coral/20 rounded-lg shadow-sm p-6">
            <h3 className="text-xl font-semibold text-black mb-6">Request New Auction</h3>
            <form onSubmit={handleAuctionRequestSubmit} className="space-y-6 bg-white p-6 rounded-2xl shadow-xl border border-[#f9d2d9]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="title" className="block font-semibold text-sm text-[#7a162e] mb-2">Item Title <span className="text-red-500">*</span> </label>
                  <input
                    id="title"
                    name="title"
                    className="w-full px-4 py-3 border border-[#f3c7ce] rounded-lg shadow-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E07385]"
                    placeholder="Auction item name"
                    value={auctionFormData.title}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label htmlFor="category" className="block font-semibold text-sm text-[#7a162e] mb-2">Category <span className="text-red-500">*</span></label>
                  <select
                    id="category"
                    name="category"
                    className="w-full px-4 py-3 border border-[#f3c7ce] rounded-lg bg-white shadow-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E07385]"
                    value={auctionFormData.category}
                    onChange={handleInputChange}
                    disabled={loadingCategories}
                  >
                    <option value="">
                      {loadingCategories ? 'Loading categories...' : 'Select category'}
                    </option>
                    {categoriesError && (
                      <option value="" disabled>Error loading categories</option>
                    )}
                    {categoriesList.map((cat) => (
                      <option key={cat.categoryId} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  {categoriesError && (
                    <p className="text-sm text-red-500 mt-1">{categoriesError}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block font-semibold text-sm text-[#7a162e] mb-2">Description <span className="text-red-500">*</span></label>
                <textarea
                  id="description"
                  name="description"
                  maxLength={255}
                  className="w-full px-4 py-3 border border-[#f3c7ce] rounded-lg shadow-sm text-gray-700 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-[#E07385]"
                  rows={4}
                  placeholder="Detailed description of your item, including craftsmanship details..."
                  value={auctionFormData.description}
                  onChange={handleInputChange}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="startingBid" className="block font-semibold text-sm text-[#7a162e] mb-2">Starting Bid (L.E) <span className="text-red-500">*</span></label>
                  <input
                    id="startingBid"
                    name="startingBid"
                    type="number"
                    className="w-full px-4 py-3 border border-[#f3c7ce] rounded-lg shadow-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E07385]"
                    placeholder="0.00"
                    value={auctionFormData.startingBid}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label htmlFor="duration" className="block font-semibold text-sm text-[#7a162e] mb-2">Auction Duration <span className="text-red-500">*</span></label>
                  <select
                    id="duration"
                    name="duration"
                    className="w-full px-4 py-3 border border-[#f3c7ce] rounded-lg shadow-sm text-gray-700 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#E07385]"
                    value={auctionFormData.duration}
                    onChange={handleInputChange}
                  >
                    <option value="3">3 days</option>
                    <option value="7">7 days</option>
                    <option value="10">10 days</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="notes" className="block font-semibold text-sm text-[#7a162e] mb-2">Notes</label>
                  <input
                    id="notes"
                    name="notes"
                    type="text"
                    className="w-full px-4 py-3 border border-[#f3c7ce] rounded-lg shadow-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E07385]"
                    placeholder="Enter your notes..."
                    value={auctionFormData.notes}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="materials" className="block font-semibold text-sm text-[#7a162e] mb-2">Materials <span className="text-red-500">*</span></label>
                  <input
                    id="materials"
                    name="materials"
                    className="w-full px-4 py-3 border border-[#f3c7ce] rounded-lg shadow-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E07385]"
                    placeholder="e.g., Clay, Natural glaze, Gold leaf"
                    value={auctionFormData.materials}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label htmlFor="dimensions" className="block font-semibold text-sm text-[#7a162e] mb-2">Dimensions <span className="text-red-500">*</span></label>
                  <input
                    id="dimensions"
                    name="dimensions"
                    className="w-full px-4 py-3 border border-[#f3c7ce] rounded-lg shadow-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E07385]"
                    placeholder="e.g., 8 x 6 x 4 inches"
                    value={auctionFormData.dimensions}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-sm text-[#7a162e] mb-2">Upload Images <span className="text-red-500">*</span></label>
                <div
                  className="relative border-4 border-dashed border-[#E07385] rounded-xl p-6 text-center bg-[#fff0f3] hover:bg-[#ffe6eb] transition cursor-pointer"
                  onClick={() => fileInputRef.current.click()}
                >
                  <Upload className="h-8 w-8 text-[#7a162e]/60 mx-auto mb-2" />
                  <p className="text-[#7a162e] font-medium">Click to upload or drag and drop</p>
                  <p className="text-sm text-gray-500">PNG, JPG up to 10MB (minimum 1 image, maximum 5 images)</p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                  />
                </div>
                {auctionFormData.images.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {auctionFormData.images.map((file, index) => (
                      <div key={index} className="relative group overflow-hidden rounded-xl border-2 border-[#E07385] shadow-md bg-white hover:scale-105 transition">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Uploaded ${index}`}
                          className="w-full h-32 object-contain"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-2 right-2 bg-white text-[#E07385] border border-[#E07385] rounded-full px-2 py-0.5 text-xs font-bold hover:bg-[#E07385] hover:text-white transition"
                          title="Remove"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-4 justify-end pt-4">
                <button
                  type="submit"
                  className="bg-[#E07385] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#7a162e] transition disabled:opacity-50"
                  disabled={loading || loadingCategories}
                >
                  {loading ? <Loader2 className="inline-block mr-2 h-4 w-4 animate-spin" /> : null}
                  Submit Request
                </button>
                <button
                  type="button"
                  onClick={() => setShowAuctionRequestForm(false)}
                  className="bg-[#fbe4e9] text-[#7a162e] px-6 py-3 rounded-lg font-semibold hover:bg-[#f5ccd4] transition disabled:opacity-50"
                  disabled={loading || loadingCategories}
                >
                  Cancel
                </button>
              </div>
            </form>

          </div>
        )}
        {!showAuctionRequestForm && (
          <div className="bg-white border border-coral/20 rounded-lg shadow-sm">
            <div className="p-6 border-b border-coral/20">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <h3 className="text-lg font-semibold text-black">Your Auction Requests</h3>

                <div className="flex gap-4 flex-wrap">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Filter by Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-coral"
                    >
                      <option value="all">All</option>
                      <option value="pending">Pending</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="active">Active</option>
                      <option value="ended">Ended</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Sort by Date</label>
                    <select
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-coral"
                    >
                      <option value="newest">Newest to Oldest</option>
                      <option value="oldest">Oldest to Newest</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {loading && (
              <div className="p-6 text-center text-burgundy">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                Fetching auction requests...
              </div>
            )}
            {!loading && auctionRequests.length === 0 && (
              <div className="p-6 text-center text-burgundy/60">
                No auction requests found.
              </div>
            )}
            {!loading && auctionRequests.length > 0 && (

              <div className="divide-y divide-coral/20">
                {visibleRequests.map((request) => {
                  const hasBids = request.auction?.bids && Object.keys(request.auction.bids).length > 0;
                  return (
                    <div
                      key={request.requestId}
                      className={`cursor-pointer group relative flex items-start gap-4 p-6 border border-coral/20 transition bg-white ${request?.auctionId ? 'hover:shadow-lg cursor-pointer' : 'opacity-60 cursor-not-allowed'
                        }`}
                      onClick={() => {
                        if (request?.auctionId) {
                          navigate(`/auction/${request?.auctionId}`);
                        }
                      }}
                    >
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-800 group-hover:text-[#7a162e] transition">
                          {request.product?.name || 'Product Title'}
                        </h4>

                        <div className="text-sm text-gray-600 mt-1 flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-x-1">
                            <PoundSterling className="w-4 h-4 text-emerald-500" />
                            Starting Bid: <strong className="text-gray-800">{request.startingPrice} EGP</strong>
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Package className="w-4 h-4 text-indigo-500" />
                            {request.product?.category?.name || 'Category'}
                          </span>
                        </div>

                        <p className="text-xs text-gray-500 mt-1">
                          Submitted on {new Date(request.createdAt).toLocaleDateString()}
                        </p>

                        {/* Scheduled / Active / Ended Details */}
                        {request.status === 'scheduled' && (
                          <div className="mt-2 text-sm text-gray-700 space-y-1">
                            <p><Clock className="inline-block w-4 h-4 mr-1" /> <strong>Start:</strong> {new Date(request.scheduledStartDate).toLocaleString()}</p>
                            <p><Clock className="inline-block w-4 h-4 mr-1" /> <strong>End:</strong> {new Date(request.scheduledEndDate).toLocaleString()}</p>
                            {request.adminNotes && (
                              <p className="text-gray-500 italic">
                                <AlertCircle className="inline-block w-4 h-4 mr-1 text-yellow-600" />
                                {request.adminNotes}
                              </p>
                            )}
                          </div>
                        )}

                        {request.auction?.status === 'ended' && (
                          <>
                            {hasBids > 0 ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleShipAuctionProduct(request.auctionId);
                                }}
                                className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold"
                              >
                                <Package className="w-4 h-4" />
                                Ship Product
                              </button>
                            ) : (
                              <p className="mt-3 text-sm text-gray-500 italic">
                                No bids were submitted. Product cannot be shipped.
                              </p>
                            )}
                          </>
                        )}


                        {request.adminNotes && request.status !== 'scheduled' && (
                          <p className="mt-2 text-sm text-gray-500 italic">
                            <AlertCircle className="inline-block w-4 h-4 mr-1 text-yellow-600" />
                            {request.adminNotes}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold transition duration-300 ${getStatusClasses(
                            request.status
                          )}`}
                        >
                          {request.status?.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>

                        {request.auction?.status && (
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold transition duration-300 ${getStatusClasses(
                              request.auction.status
                            )}`}
                          >
                            Auction: {request.auction.status.charAt(0).toUpperCase() + request.auction.status.slice(1)}
                          </span>
                        )}
                      </div>



                    </div>
                  );

                })}
                {visibleCount < filteredRequests.length && (
                  <div className="p-6 text-center">
                    <button
                      onClick={() => setVisibleCount(prev => prev + 5)}
                      className="px-6 py-2 bg-coral text-white font-semibold rounded-lg shadow hover:bg-coral/90 transition"
                    >
                      Load More
                    </button>
                  </div>
                )}

              </div>
            )}
          </div>
        )}

      </div>
    </>
  );
};

export default AuctionRequest;

