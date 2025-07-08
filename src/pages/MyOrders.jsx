import { useEffect, useState } from 'react';
import axios from 'axios';
import {
    FiPackage,
    FiTruck,
    FiCheckCircle,
    FiXCircle,
    FiClock,
    FiStar,
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import ReviewModal from '../Components/ReviewModal';
const MyOrders = () => {
    const [orders, setOrders] = useState([]);
    const [activeFilter, setActiveFilter] = useState('all');
    const [isLoading, setIsLoading] = useState(true);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [currentProduct, setCurrentProduct] = useState(null);
    const [currentArtist, setCurrentArtist] = useState(null);
    const [rating, setRating] = useState(0);
    const [review, setReview] = useState('');
    const [artistRating, setArtistRating] = useState(0);
    const [artistComment, setArtistComment] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                setIsLoading(true);
                const response = await axios.get('http://localhost:3000/order/myOrders', {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                });
                const sortedOrders = response.data.orders.sort(
                    (a, b) => new Date(b.orderDate) - new Date(a.orderDate)
                );
                setOrders(sortedOrders);
            } catch (error) {
                console.error('Error fetching orders:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrders();
    }, []);

    const filteredOrders = orders.filter((order) => {
        if (activeFilter === 'all') return true;
        return order.status.toLowerCase() === activeFilter;
    });

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Shipping': return <FiTruck className="mr-1" />;
            case 'Completed': return <FiCheckCircle className="mr-1" />;
            case 'Cancelled': return <FiXCircle className="mr-1" />;
            case 'Pending': return <FiClock className="mr-1" />;
            default: return <FiClock className="mr-1" />;
        }
    };

    const handleCancelOrder = async (orderId) => {
        try {
            const confirmed = window.confirm("Are you sure you want to cancel this order?");
            if (!confirmed) return;

            await axios.put(`http://localhost:3000/order/cancel/${orderId}`, {}, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });

            setOrders(prevOrders =>
                prevOrders.map(order =>
                    order.orderId === orderId ? { ...order, status: 'Cancelled' } : order
                )
            );
        } catch (error) {
            console.error('Error cancelling order:', error);
            toast.error("Failed to cancel the order.");
        }
    };

    const handlePayOrder = (orderId) => {
        navigate(`/payment/${orderId}`);
    };

    const openReviewModal = (product, artist) => {
        setCurrentProduct(product);
        setCurrentArtist(artist);
        setShowReviewModal(true);
    };

    const closeReviewModal = () => {
        setShowReviewModal(false);
        setCurrentProduct(null);
        setCurrentArtist(null);
        setRating(0);
        setReview('');
        setArtistRating(0);
        setArtistComment('');
    };

    const submitReview = async () => {
        if (rating === 0) {
            toast.error('Please select a rating');
            return;
        }

        if (!review || review.trim().length < 20) {
            toast.error('Please write a review with at least 20 characters');
            return;
        }

        const reviewData = {
            productId: currentProduct.productId || currentProduct.id,
            rating: rating,
            review: review.trim(),
        };
        if (artistRating > 0) {
            reviewData.artistRating = artistRating;
            reviewData.artistComment = artistComment?.trim() || "";
        }

        try {
            const response = await axios.post(
                'http://localhost:3000/review/create',
                reviewData,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (response.status === 201) {
                toast.success('Thank you for your review!');
                setOrders(prevOrders =>
                    prevOrders.map(order => {
                        return {
                            ...order,
                            products: order.products.map(product => {
                                if (
                                    (product.productId === currentProduct.productId || product.id === currentProduct.id)
                                ) {
                                    return {
                                        ...product,
                                        reviewed: true,
                                    };
                                }
                                return product;
                            }),
                        };
                    })
                );

                closeReviewModal();
            } else {
                toast.success('Something went wrong. Please try again.');
            }
        } catch (error) {
            console.error('Error submitting review:', error);
            toast.error(
                error.response?.data?.message ||
                error.message ||
                'Failed to submit review. Please try again.'
            );
        }
    };
    return (
        <div className="px-4 sm:px-6 lg:px-8 py-12 bg-[var(--color-cream)] min-h-screen">

            <ReviewModal
                isOpen={showReviewModal}
                onClose={closeReviewModal}
                product={currentProduct}
                rating={rating}
                setRating={setRating}
                review={review}
                setReview={setReview}
                artistRating={artistRating}
                setArtistRating={setArtistRating}
                artistComment={artistComment}
                setArtistComment={setArtistComment}
                onSubmit={submitReview}
            />

            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-[var(--color-burgundy)] mb-2">My Orders</h2>
                        <p className="text-gray-600">View and manage your order history</p>
                    </div>
                    <div className="mt-4 md:mt-0">
                        <button className="bg-[var(--color-coral)] text-white px-6 py-2 rounded-lg hover:bg-[var(--color-burgundy)] transition-all shadow-sm flex items-center">
                            <FiPackage className="mr-2" /> Need Help?
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto mb-8 text-center">
                    <div className="inline-flex gap-3 min-w-max px-2 py-1 rounded-xl bg-white shadow-inner border border-[var(--color-coral)/30]">
                        {[
                            { label: 'All Orders', value: 'all', icon: null },
                            { label: 'Shipped', value: 'shipped', icon: <FiTruck className="mr-1" /> },
                            { label: 'Completed', value: 'completed', icon: <FiCheckCircle className="mr-1" /> },
                            { label: 'Cancelled', value: 'cancelled', icon: <FiXCircle className="mr-1" /> },
                            { label: 'Pending', value: 'pending', icon: <FiClock className="mr-1" /> },
                        ].map(({ label, value, icon }) => (
                            <button
                                key={value}
                                onClick={() => setActiveFilter(value)}
                                className={`whitespace-nowrap px-4 py-2 rounded-full flex items-center transition-all duration-200 text-sm font-medium
                                    ${activeFilter === value
                                        ? 'bg-[var(--color-burgundy)] text-white shadow-md'
                                        : 'text-[var(--color-burgundy)] hover:bg-[var(--color-coral)/10]'}
                                `}
                            >
                                {icon} {label}
                            </button>
                        ))}
                    </div>
                </div>
                {filteredOrders.length === 0 ? (
                    <div className="bg-[#FAF9F6] rounded-xl shadow-sm p-8 text-center">
                        <FiPackage className="mx-auto text-4xl text-gray-400 mb-4" />
                        <h3 className="text-xl font-medium text-gray-700 mb-2">
                            {activeFilter === 'all' ? 'No orders yet' : `No ${activeFilter} orders`}
                        </h3>
                        <p className="text-gray-500 max-w-md mx-auto">
                            {activeFilter === 'all'
                                ? "You haven't placed any orders yet. Start shopping to see your orders here!"
                                : `You don't have any ${activeFilter} orders at the moment.`}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filteredOrders.map((order, index) => (
                            <div
                                key={index}
                                className="bg-[#FAF9F6] p-6 rounded-xl border border-gray-300 hover:shadow-md transition-all"
                            >
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4">
                                    <div>
                                        <div className="text-sm text-gray-500 mb-1">Order #{order.orderId}</div>
                                        <div className="text-lg font-semibold text-[var(--color-burgundy)]">
                                            {order.products?.length} Item{order.products?.length !== 1 ? 's' : ''}
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:items-end">
                                        <div className="text-sm text-gray-500 mb-1">
                                            {new Date(order.createdAt).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                            })}
                                        </div>
                                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${order.status === 'Completed'
                                            ? 'bg-[var(--color-burgundy)/10] text-[var(--color-burgundy)]'
                                            : order.status === 'Cancelled'
                                                ? 'bg-red-100 text-red-800'
                                                : order.status === 'Shipping'
                                                    ? 'bg-[var(--color-coral)/20] text-[var(--color-coral)]'
                                                    : order.status === 'Pending'
                                                        ? 'bg-yellow-100 text-yellow-800'
                                                        : 'bg-gray-100 text-gray-700'
                                            }`}>
                                            {getStatusIcon(order.status)} {order.status}
                                        </div>
                                    </div>
                                </div>
                                <div className="border-t border-gray-200 pt-4 mb-4">
                                    <div className="flex overflow-x-auto gap-4 pb-2">
                                        {order.products?.map((item, i) => (
                                            <div
                                                key={i}
                                                className="flex-shrink-0 w-52 h-64 bg-white rounded-lg shadow overflow-hidden hover:scale-[1.02] transition-transform relative cursor-pointer"
                                            >
                                                {item.image?.[0] && (
                                                    <img
                                                        src={item.image[0]}
                                                        alt={item.name}
                                                        className="w-full h-2/3 object-cover"
                                                    />
                                                )}
                                                <div className="p-2 h-1/3 flex flex-col justify-between">
                                                    <h4 className="text-sm font-semibold text-gray-800 truncate">{item.name}</h4>
                                                    <p className="text-xs text-gray-700">
                                                        Price: <span className="font-medium">{parseFloat(item.price).toLocaleString()} LE</span>
                                                    </p>
                                                    <p className="text-xs text-gray-700">
                                                        Qty: <span className="font-medium">{item.productorder?.quantity}</span>
                                                    </p>
                                                </div>
                                                {!item.reviewed && (
                                                    (
                                                        (item.type !== 'customizable' && item.type !== 'auction' && order.status === 'Completed') ||
                                                        (item.type === 'customizable' && order.status === 'Shipped') ||
                                                        (item.type === 'auction' && order.status === 'Shipped')
                                                    ) && (
                                                        <div
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur-md rounded-xl p-2 flex flex-col items-center shadow-md border border-[var(--color-burgundy)/30] animate-fadeIn"
                                                        >
                                                            <p className="text-xs text-[var(--color-burgundy)] font-semibold mb-1">
                                                                Enjoyed this product? Leave a review!
                                                            </p>
                                                            <button
                                                                onClick={() => openReviewModal(item, item.artist)}
                                                                className="flex items-center gap-1 px-3 py-1 bg-[var(--color-burgundy)] text-white text-xs rounded-full hover:bg-[var(--color-coral)] transition-colors duration-300"
                                                            >
                                                                <FiStar size={14} className="text-yellow-300 animate-pulse" />
                                                                Rate & Review
                                                            </button>
                                                        </div>
                                                    )
                                                )}

                                            </div>
                                        ))}

                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Total Amount</p>
                                        <p className="text-xl font-bold text-[var(--color-burgundy)]">
                                            LE {parseFloat(order.totalAmount).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="flex gap-4 items-center">
                                        {(order.status === 'Pending' || order.status === 'Shipping') && (
                                            <div className="flex items-center space-x-3">
                                                <button
                                                    onClick={() => handlePayOrder(order.orderId)}
                                                    className="relative px-4 py-2 rounded-lg group overflow-hidden transition-all duration-300 shadow-md"
                                                >
                                                    <div className="absolute inset-0 bg-green-500/10 backdrop-blur-sm group-hover:bg-green-500/20 transition-all duration-300 border border-green-400/30 rounded-lg"></div>
                                                    <div className="relative flex items-center">
                                                        <svg
                                                            className="w-4 h-4 mr-2 text-green-600 group-hover:text-green-700 transition-colors"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                                        </svg>
                                                        <span className="text-sm font-medium text-green-700 group-hover:text-green-800 transition-colors">
                                                            Pay Now
                                                        </span>
                                                    </div>
                                                    <div className="absolute inset-0 border-2 border-transparent group-hover:border-green-400/30 rounded-lg transition-all duration-300 pointer-events-none"></div>
                                                </button>
                                                <button
                                                    onClick={() => handleCancelOrder(order.orderId)}
                                                    className="relative px-4 py-2 rounded-lg group overflow-hidden transition-all duration-300 shadow-md"
                                                >
                                                    <div className="absolute inset-0 bg-red-500/10 backdrop-blur-sm group-hover:bg-red-500/20 transition-all duration-300 border border-red-400/30 rounded-lg"></div>
                                                    <div className="relative flex items-center">
                                                        <svg
                                                            className="w-4 h-4 mr-2 text-red-600 group-hover:text-red-700 transition-colors"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                                        </svg>
                                                        <span className="text-sm font-medium text-red-700 group-hover:text-red-800 transition-colors">
                                                            Cancel
                                                        </span>
                                                    </div>
                                                    <div className="absolute inset-0 border-2 border-transparent group-hover:border-red-400/30 rounded-lg transition-all duration-300 pointer-events-none"></div>
                                                </button>
                                            </div>
                                        )}
                                        {(order.status !== 'Pending' && order.status !== 'Shipping') && (
                                            <span className="text-sm text-gray-400 italic">Not actionable</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyOrders;
