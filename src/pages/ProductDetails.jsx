import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import ProductInfo from "../Components/ProductInfo";
import ProductReview from "../Components/ProductReview";
import Footer from "../Components/Footer";

const ProductDetails = () => {
  const { state } = useLocation();
  const [reviewStats, setReviewStats] = useState({
    averageRating: state?.product?.averageRating || 0,
    totalReviews: state?.product?.totalReviews || 0,
  });

  const product = state?.product;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!product) {
    return (
      <div className="text-center mt-20 text-2xl font-semibold text-red-500">
        Product not found
      </div>
    );
  }

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 py-12 space-y-16">
        <ProductInfo
          product={{
            ...product,
            rating: reviewStats.averageRating,
            totalReviews: reviewStats.totalReviews,
          }}
        />
        <ProductReview
          productId={product.id}
          onStatsUpdate={({ averageRating, totalReviews }) =>
            setReviewStats({ averageRating, totalReviews })
          }
        />
      </div>
      <Footer />
    </>
  );
};

export default ProductDetails;