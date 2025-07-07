import React, { useState, useEffect } from 'react';
import { FiStar, FiX, FiCheck, FiHeart, FiEdit2 } from 'react-icons/fi';

const ReviewModal = ({
    isOpen,
    onClose,
    product,
    rating,
    setRating,
    review,
    setReview,
    artistRating,
    setArtistRating,
    artistComment,
    setArtistComment,
    onSubmit
}) => {
    const [activeTab, setActiveTab] = useState('product');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [characterCount, setCharacterCount] = useState(0);

    useEffect(() => {
        setCharacterCount(review.length);
    }, [review]);

    if (!isOpen || !product) return null;

   const handleSubmit = async () => {
    if (artistRating === 0 && activeTab === 'artist') {
        const confirmSkip = confirm("You didn't rate the artist. Do you want to publish without rating the artist?");
        if (!confirmSkip) return;
    }

    setIsSubmitting(true);
    try {
        await onSubmit();
    } finally {
        setIsSubmitting(false);
    }
};


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-lg bg-black/30 transition-opacity duration-500">
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all duration-500 scale-95 hover:scale-100 border border-white/20">
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 z-10 p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-gray-100 transition-all duration-300 hover:rotate-90 group"
                >
                    <FiX className="text-gray-600 group-hover:text-gray-900 text-xl transition-colors" />
                </button>
                <div className="relative p-6 pb-4 border-b border-gray-100/50">
                    <div className="absolute -top-20 -left-20 w-40 h-40 bg-[var(--color-burgundy)] rounded-full filter blur-3xl opacity-10"></div>
                    <div className="relative z-1">
                        <h3 className="text-3xl font-bold text-gray-900 bg-clip-text bg-gradient-to-r from-[var(--color-burgundy)] to-[var(--color-coral)] text-transparent">
                            Share Your Artistic Journey
                        </h3>
                        <p className="text-sm text-gray-500 mt-2">Your insights inspire our creative community</p>
                    </div>
                </div>
                <div className="flex border-b border-gray-100/50 px-6">
                    <button
                        onClick={() => setActiveTab('product')}
                        className={`px-4 py-3 font-medium text-sm flex items-center gap-2 relative ${activeTab === 'product' ? 'text-[var(--color-burgundy)]' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <FiHeart className="text-lg" />
                        The Artwork
                        {activeTab === 'product' && (
                            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[var(--color-burgundy)] to-[var(--color-coral)]"></span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('artist')}
                        className={`px-4 py-3 font-medium text-sm flex items-center gap-2 relative ${activeTab === 'artist' ? 'text-[var(--color-burgundy)]' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <FiEdit2 className="text-lg" />
                        The Artist
                        {activeTab === 'artist' && (
                            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[var(--color-burgundy)] to-[var(--color-coral)]"></span>
                        )}
                    </button>
                </div>

                <div className="max-h-[65vh] overflow-y-auto custom-scrollbar">
                    {activeTab === 'product' && (
                        <div className="p-6">
                            <div className="flex flex-col md:flex-row gap-6 mb-8 p-5 bg-white rounded-2xl shadow-sm border border-gray-100/70">
                                <div className="relative w-full md:w-1/3 h-48 overflow-hidden rounded-xl">
                                    <img
                                        src={product.image?.[0]}
                                        alt={product.name}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl" />
                                </div>
                                <div className="w-full md:w-2/3">
                                    <h4 className="font-bold text-gray-900 text-lg">{product.name}</h4>
                                    <p className="text-sm text-gray-500 mb-5">Your artistic impression</p>

                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-3">Rate this masterpiece</label>
                                        <div className="flex items-center gap-1">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    onClick={() => setRating(star)}
                                                    className="transition-all duration-200 hover:scale-110 active:scale-95"
                                                >
                                                    <div className={`relative w-10 h-10 ${star <= rating ? 'text-amber-400' : 'text-gray-300'}`}>
                                                        <FiStar className="absolute inset-0 w-full h-full" />
                                                        {star <= rating && (
                                                            <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full blur-[6px] opacity-70"></div>
                                                        )}
                                                    </div>
                                                </button>
                                            ))}
                                            <span className="ml-3 text-sm font-medium text-gray-700">
                                                {rating > 0 ? `${rating}.0` : "Tap to rate"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-6">
                                <div className="flex justify-between items-center mb-3">
                                    <label className="block text-sm font-medium text-gray-700">Your artistic critique</label>
                                    <span className={`text-xs ${characterCount >= 20 ? 'text-emerald-500' : 'text-amber-500'}`}>
                                        {characterCount}/20
                                    </span>
                                </div>
                                <div className="relative">
                                    <textarea
                                        value={review}
                                        onChange={(e) => setReview(e.target.value)}
                                        className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--color-burgundy)] focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
                                        rows="5"
                                        placeholder="Describe your experience with this artwork... What emotions did it evoke? How does it compare to your expectations?"
                                    ></textarea>
                                    <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                                        <span className="inline-block px-2 py-1 bg-white/70 rounded-full backdrop-blur-sm">
                                            Be authentic
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === 'artist' && (
                        <div className="p-6">
                            <div className="mb-8 p-5 bg-white rounded-2xl shadow-sm border border-gray-100/70">
                                <h4 className="font-bold text-gray-900 text-lg mb-1">About the Artist</h4>
                                <p className="text-sm text-gray-500 mb-6">Share your thoughts on the creator</p>

                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-3">Artist's craftsmanship</label>
                                    <div className="flex items-center gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                onClick={() => setArtistRating(star)}
                                                className="transition-all duration-200 hover:scale-110 active:scale-95"
                                            >
                                                <div className={`relative w-10 h-10 ${star <= artistRating ? 'text-amber-400' : 'text-gray-300'}`}>
                                                    <FiStar className="absolute inset-0 w-full h-full" />
                                                    {star <= artistRating && (
                                                        <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full blur-[6px] opacity-70"></div>
                                                    )}
                                                </div>

                                            </button>
                                        ))}
                                        <span className="ml-3 text-sm font-medium text-gray-700">
                                            {artistRating > 0 ? `${artistRating}.0` : "Rate the artist"}
                                        </span>
                                    </div>
                                </div>

                                <div className="mb-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-3">Your Comment to the artist</label>
                                    <textarea
                                        value={artistComment}
                                        onChange={(e) => setArtistComment(e.target.value)}
                                        className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--color-coral)] focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
                                        rows="4"
                                        placeholder="What impressed you about their work? Any suggestions for their artistic journey?"
                                    ></textarea>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <div className="sticky bottom-0 bg-gradient-to-b from-white/80 to-white backdrop-blur-lg border-t border-white/20 p-4 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                        <span>Your review will be public</span>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleSubmit}
                            disabled={rating === 0 || isSubmitting}
                            className={`px-6 py-3 bg-[var(--color-burgundy)] text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 group`}
                        >
                            {isSubmitting ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Publishing...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <FiCheck className="group-hover:scale-125 transition-transform" />
                                    Publish Review
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReviewModal;
