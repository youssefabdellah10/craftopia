import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from "../context/CartContext";

const PaymentPage = () => {
    const { orderId } = useParams();
    const [order, setOrder] = useState(null);
    const [reference, setReference] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isPaying, setIsPaying] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [expiryDate, setExpiryDate] = useState('');
    const [cardFocused, setCardFocused] = useState(false);
    const { clearCart } = useCart();

    const navigate = useNavigate();

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const response = await axios.get(`http://localhost:3000/order/${orderId}`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                });
                setOrder(response.data.order);
            } catch (err) {
                console.error('Failed to load order:', err);
                setError('Failed to load order details. Please try again later.');
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [orderId]);

    const handlePayment = async () => {
        const cleanedReference = reference.replace(/\s+/g, '');

        if (!reference) {
            setError("Credit Card number is required.");
            return;
        }

        if (!/^\d{16}$/.test(cleanedReference)) {
            setError("Please enter a valid 16-digit card number.");
            return;
        }

        if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
            setError("Please enter a valid expiry date in MM/YY format.");
            return;
        }

        setIsPaying(true);
        setError('');

        try {
            await axios.post(
                `http://localhost:3000/payment/escrow/pay/${order.orderId}?creditCardNumber=${cleanedReference}&expiryDate=${expiryDate}`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            );
            clearCart();
            setPaymentSuccess(true);
            setTimeout(() => {
                navigate('/orders');
            }, 2000);

        } catch (err) {
            console.error('Payment error:', err);
            setError(err.response?.data?.message || 'Payment failed. Please check your card details and try again.');
        } finally {
            setIsPaying(false);
        }
    };

    const formatCardNumber = (value) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        const parts = [];

        for (let i = 0; i < v.length && i < 16; i += 4) {
            parts.push(v.substring(i, i + 4));
        }

        return parts.join(' ');
    };

    const handleCardInputChange = (e) => {
        const input = e.target.value.replace(/\D/g, '');
        setReference(input);
    };

    const formatExpiryDate = (value) => {
        const v = value.replace(/\D/g, '');
        if (v.length >= 3) {
            return `${v.slice(0, 2)}/${v.slice(2, 4)}`;
        }
        return v;
    };

    const handleExpiryChange = (e) => {
        const formattedValue = formatExpiryDate(e.target.value);
        setExpiryDate(formattedValue);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 text-center">
                    <div className="animate-pulse flex justify-center mb-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-700">Loading your order details...</h3>
                    <p className="text-base text-gray-500 mt-2">Please wait while we prepare your payment</p>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                        <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-700">Order Not Found</h3>
                    <p className="text-base text-gray-500 mt-2">{error || 'The order you are looking for does not exist.'}</p>
                    <button
                        onClick={() => navigate('/')}
                        className="mt-4 w-full bg-[var(--color-burgundy)] text-white py-3 px-4 rounded-lg hover:bg-[var(--color-coral)] transition-colors text-lg shadow-md hover:shadow-lg"
                    >
                        Return to Home
                    </button>
                </div>
            </div>
        );
    }

    if (paymentSuccess) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[var(--color-cream)]/30 to-white p-6 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-40 h-40 bg-[var(--color-burgundy)]/5 rounded-full filter blur-xl transform -translate-x-20 -translate-y-20"></div>
                <div className="absolute bottom-0 right-0 w-60 h-60 bg-[var(--color-coral)]/5 rounded-full filter blur-xl transform translate-x-20 translate-y-20"></div>
                <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-8 text-center relative z-10 transform transition-all duration-700 animate-float">
                    <div className="relative mx-auto mb-8">
                        <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-burgundy)] to-[var(--color-coral)] rounded-full opacity-20 blur-md animate-pulse-slow w-24 h-24 -ml-12 -mt-12"></div>
                        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-green-100 to-green-50 shadow-inner mb-6 animate-scale-pop border-4 border-green-100/50">
                            <svg
                                className="h-10 w-10 text-green-600 animate-draw-check"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M5 13l4 4L19 7"
                                    pathLength="100"
                                    strokeDasharray="100"
                                    strokeDashoffset="100"
                                    style={{
                                        animation: "draw-check 1s ease-in-out forwards",
                                        animationDelay: "0.3s"
                                    }}
                                />
                            </svg>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-4xl font-extrabold text-gray-800 mb-2 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
                            Payment Successful!
                        </h2>
                        <p className="text-xl text-gray-600 animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
                            Your order <span className="font-semibold text-[var(--color-coral)]">#{order.orderId}</span> has been completed.
                        </p>
                        <div className="mt-6 animate-fade-in-up" style={{ animationDelay: "0.6s" }}>
                            <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[var(--color-cream)]/30 to-white rounded-full border border-[var(--color-cream)] shadow-sm">
                                <span className="text-lg font-medium text-gray-500 mr-2">Amount Paid:</span>
                                <span className="text-2xl font-bold text-[var(--color-burgundy)]">
                                    {parseFloat(order.totalAmount).toLocaleString('en-US', {
                                        style: 'currency',
                                        currency: 'EGP',
                                        minimumFractionDigits: 2,
                                    })}
                                </span>
                            </div>
                        </div>
                        <div className="mt-8 animate-fade-in-up" style={{ animationDelay: "0.7s" }}>
                            <div className="relative pt-1">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-[var(--color-burgundy)] bg-[var(--color-cream)]">
                                            Redirecting...
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs font-semibold inline-block text-[var(--color-coral)]">
                                            3s
                                        </span>
                                    </div>
                                </div>
                                <div className="overflow-hidden h-2 mt-2 rounded-full bg-gray-100">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-[var(--color-burgundy)] to-[var(--color-coral)] animate-progress"
                                        style={{ animationDuration: "3s" }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-8 animate-fade-in-up" style={{ animationDelay: "0.8s" }}>
                            <button
                                onClick={() => navigate('/')}
                                className="px-6 py-3 text-sm font-medium text-[var(--color-burgundy)] hover:text-white border border-[var(--color-burgundy)] hover:bg-[var(--color-burgundy)] rounded-full transition-all duration-300 hover:shadow-lg"
                            >
                                Continue Shopping
                            </button>
                        </div>
                    </div>
                </div>
                <style jsx global>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                @keyframes scale-pop {
                    0% { transform: scale(0); opacity: 0; }
                    80% { transform: scale(1.1); opacity: 1; }
                    100% { transform: scale(1); }
                }
                @keyframes draw-check {
                    to { stroke-dashoffset: 0; }
                }
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes pulse-slow {
                    0%, 100% { opacity: 0.2; }
                    50% { opacity: 0.3; }
                }
                @keyframes progress {
                    from { width: 0%; }
                    to { width: 100%; }
                }
                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }
                .animate-scale-pop {
                    animation: scale-pop 0.7s ease-out forwards;
                }
                .animate-draw-check {
                    animation: draw-check 0.7s ease-out forwards;
                }
                .animate-fade-in-up {
                    opacity: 0;
                    animation: fade-in-up 0.6s ease-out forwards;
                }
                .animate-pulse-slow {
                    animation: pulse-slow 3s ease-in-out infinite;
                }
                .animate-progress {
                    animation: progress 3s linear forwards;
                }
            `}</style>
            </div>
        );
    }
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                <div className="bg-white overflow-hidden shadow-xl rounded-3xl">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                        <div className="p-8 lg:p-10 border-r border-gray-100 relative overflow-hidden">

                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-3xl font-bold text-gray-900">Order Summary</h2>
                                    <span className="inline-flex items-center px-4 py-2 rounded-full text-base font-semibold bg-[var(--color-burgundy)] text-white shadow-sm">
                                        Order #{order.orderId}
                                    </span>
                                </div>

                                <div className="space-y-2 mb-8 text-lg">
                                    <p className="text-gray-600">
                                        <span className="font-medium">Date:</span>  {new Date(order.createdAt).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                    </p>
                                </div>

                                <div className="bg-[#FAF9F6] p-6 rounded-xl mb-8 border border-gray-100 shadow-sm">
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-semibold text-gray-700 text-lg">Total Amount</h3>
                                        <p className="text-3xl font-bold text-[var(--color-coral)]">
                                            {parseFloat(order.totalAmount).toLocaleString('en-US', {
                                                style: 'currency',
                                                currency: 'EGP',
                                                minimumFractionDigits: 2,
                                            })}
                                        </p>
                                    </div>
                                </div>

                                <h3 className="text-2xl font-semibold text-gray-900 mb-6">Your Items</h3>
                                <div className="space-y-4">
                                    {order.products?.map((item, index) => (
                                        <div key={index} className="flex items-start space-x-4 p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md">
                                            <div className="relative">
                                                <img
                                                    src={item.image?.[0] || '/placeholder-product.jpg'}
                                                    alt={item.name}
                                                    className="flex-shrink-0 w-20 h-20 rounded-lg object-cover border border-gray-200"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = '/placeholder-product.jpg';
                                                    }}
                                                />
                                                <span className="absolute -top-2 -right-2 bg-[var(--color-burgundy)] text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                                                    {item.productorder?.quantity}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-base font-semibold text-gray-900 truncate">{item.name}</p>
                                                <p className="text-sm text-gray-500 mt-1">Unit Price: {parseFloat(item.price).toFixed(2)} LE</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-base font-semibold text-gray-900">
                                                    {parseFloat(item.price * item.productorder?.quantity).toLocaleString('en-US', {
                                                        style: 'currency',
                                                        currency: 'EGP',
                                                        minimumFractionDigits: 2,
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="p-8 lg:p-10 bg-gray-50">
                            <div className="max-w-md mx-auto">
                                <h2 className="text-3xl font-bold text-gray-900 mb-8">Payment Details</h2>

                                {error && (
                                    <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-100 animate-shake">
                                        <div className="flex">
                                            <svg className="h-5 w-5 text-red-400 mt-1 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                            </svg>
                                            <div>
                                                <p className="text-base text-red-800">{error}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div className={`mb-6 p-6 rounded-xl border-2 ${cardFocused ? 'border-[var(--color-burgundy)]' : 'border-gray-200'} bg-white shadow-sm transition-all duration-300`}>
                                    <div className="flex justify-between items-center mb-6">
                                        <div className="text-sm font-medium text-gray-500">Credit Card</div>
                                        <div className="flex space-x-2">
                                            <div className="w-10 h-6 bg-gray-200 rounded-sm"></div>
                                            <div className="w-10 h-6 bg-gray-200 rounded-sm"></div>
                                        </div>
                                    </div>
                                    <div className="mb-6">
                                        <div className="text-xs text-gray-400 mb-1">Card Number</div>
                                        <div className="text-xl font-mono tracking-wider">
                                            {reference ? formatCardNumber(reference) : '•••• •••• •••• ••••'}
                                        </div>
                                    </div>
                                    <div className="flex justify-between">
                                        <div>
                                            <div className="text-xs text-gray-400 mb-1">Expires</div>
                                            <div className="text-sm font-medium">
                                                {expiryDate || '••/••'}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-sm font-mono">
                                                •••
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label htmlFor="card-number" className="block text-sm font-medium text-gray-700 mb-2">
                                            Card Number
                                        </label>
                                        <input
                                            type="text"
                                            id="card-number"
                                            inputMode="numeric"
                                            maxLength="19"
                                            value={formatCardNumber(reference)}
                                            onChange={handleCardInputChange}
                                            onFocus={() => setCardFocused(true)}
                                            onBlur={() => setCardFocused(false)}
                                            placeholder="0000 0000 0000 0000"
                                            className="block w-full px-5 py-4 text-base border border-gray-300 rounded-xl shadow-md bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-burgundy)] focus:border-[var(--color-burgundy)] transition-all duration-300"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="expiry-date" className="block text-sm font-medium text-gray-700 mb-2">
                                            Expiry Date
                                        </label>
                                        <input
                                            type="text"
                                            id="expiry-date"
                                            placeholder="MM/YY"
                                            maxLength="5"
                                            value={expiryDate}
                                            onChange={handleExpiryChange}
                                            className="block w-full px-5 py-4 text-base border border-gray-300 rounded-xl shadow-md bg-white focus:ring-2 focus:ring-[var(--color-burgundy)] focus:border-[var(--color-burgundy)] transition-all duration-300"
                                        />
                                    </div>


                                    <button
                                        onClick={handlePayment}
                                        disabled={isPaying}
                                        className={`w-full flex justify-center py-4 px-6 border border-transparent rounded-lg shadow-lg text-xl font-semibold text-white bg-[var(--color-burgundy)] hover:bg-[var(--color-coral)] transition-all duration-300 transform hover:scale-[1.01] ${isPaying ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        {isPaying ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Processing Payment
                                            </>
                                        ) : (
                                            `Pay ${parseFloat(order.totalAmount).toLocaleString('en-US', {
                                                style: 'currency',
                                                currency: 'EGP',
                                                minimumFractionDigits: 2,
                                            })}`
                                        )}
                                    </button>
                                </div>

                                <div className="mt-8 pt-6 border-t border-gray-200">
                                    <h3 className="font-medium text-gray-700 mb-3">Secure Payment</h3>
                                    <p className="text-gray-500 mb-4 text-sm">
                                        Your payment is processed securely. We do not store your credit card details.
                                    </p>
                                    <div className="flex space-x-4 items-center">
                                        <div className="flex space-x-2">
                                            <img className="h-6" src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/2560px-Visa_Inc._logo.svg.png" alt="Visa" />
                                            <img className="h-6" src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1280px-Mastercard-logo.svg.png" alt="Mastercard" />
                                            <img className="h-6" src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/American_Express_logo_%282018%29.svg/1200px-American_Express_logo_%282018%29.svg.png" alt="Amex" />
                                        </div>
                                        <div className="ml-auto flex items-center text-xs text-gray-400">
                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                                            </svg>
                                            SSL Secured
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentPage;