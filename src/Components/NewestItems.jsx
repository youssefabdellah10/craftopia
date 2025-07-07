import { useState, useEffect } from "react";
import { FaStar, FaHeart } from "react-icons/fa";
import axios from "axios";

const NewestItems = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    axios
      .get("https://dummyjson.com/products/category/home-decoration?limit=3")
      .then((res) => {
        const shuffledProducts = res.data.products.sort(() => Math.random() - 0.5);
        setProducts(shuffledProducts);
      })
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="p-6 bg-[#FAF9F6] pl-30 mt-12">
      <h2 className="text-xl font-bold mb-4">Discover Our Newest Handmade Products</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-[#F6EEEE] rounded-lg shadow-lg p-3 flex flex-col justify-between border border-gray-200"
          >
            <div className="relative group">
              <img
                src={product.thumbnail}
                alt={product.title}
                className="rounded-md w-full h-40 object-cover"
              />
              <FaHeart className="absolute top-2 left-2 text-[#921A40] text-3xl rounded-full p-1" />

              <button className="absolute bottom-0 left-0 w-full bg-[#E07385] text-white text-sm font-bold py-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Add to cart
              </button>
            </div>

            <h3 className="font-bold mt-2 text-sm h-8 truncate">{product.title}</h3>
            <div className="flex justify-between items-center">
              <p className="text-gray-700 text-sm">{product.price} LE</p>
              <div className="flex items-center">
                <span className="text-sm font-bold">{product.rating.toFixed(1)}</span>
                <FaStar className="text-yellow-500 ml-1 text-sm" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center mt-6">
        <button className="bg-[#E07385] text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-[#921A40] transition">
          SEE MORE
        </button>
      </div>
    </div>
  );
};

export default NewestItems;
