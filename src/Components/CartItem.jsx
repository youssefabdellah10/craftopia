import { FiTrash2, FiMinus, FiPlus } from 'react-icons/fi';

const CartItem = ({ item, onQuantityChange, onRemove }) => {
  const handleDecrease = () => {
    if (item.cartQuantity > 1) {
      onQuantityChange('dec');
    }
  };

  const handleIncrease = () => {
    if (item.cartQuantity < item.stockQuantity) {
      onQuantityChange('inc');
    }
  };

  const reachedMax = item.cartQuantity >= item.stockQuantity;

  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center gap-4">
        <img
          src={item.image[0]}
          alt={item.name}
          className="w-20 h-20 object-cover rounded-lg"
        />
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{item.name}</h2>
          <span className="inline-block bg-[#ebaeb873] text-[#000000] text-xs font-semibold px-3 py-1 rounded-full mt-1">
            {item.category}
          </span>

          <p className="text-lg font-bold text-gray-900 mt-1">
            ${(item.price * item.cartQuantity).toFixed(2)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={handleDecrease}
            disabled={item.cartQuantity <= 1}
            className={`p-2 rounded-md transition-colors duration-200 ${
              item.cartQuantity <= 1 
                ? "text-gray-300 cursor-not-allowed" 
                : "text-gray-600 hover:text-red-700 hover:bg-red-50"
            }`}
          >
            <FiMinus size={20} />
          </button>

          <span className="px-3 py-1 bg-gray-100 rounded-md min-w-[40px] text-center font-semibold">
            {item.cartQuantity}
          </span>

          <button
            onClick={handleIncrease}
            disabled={reachedMax}
            className={`p-2 rounded-md transition-colors duration-200 ${
              reachedMax 
                ? "text-gray-300 cursor-not-allowed" 
                : "text-gray-600 hover:text-green-700 hover:bg-green-50"
            }`}
            title={reachedMax ? "Maximum stock reached" : ""}
          >
            <FiPlus size={20} />
          </button>
        </div>

        <button 
          onClick={() => onRemove(item.id)} 
          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors duration-200"
        >
          <FiTrash2 size={20} />
        </button>
      </div>
    </div>
  );
};

export default CartItem;
