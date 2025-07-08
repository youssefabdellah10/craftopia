import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';


const ShopByCategory = () => {
  const [categories, setCategories] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('http://localhost:3000/category/all');
        const data = await response.json();

        const formatted = data.categories.map((category, index) => ({
          ...category,
          icon: <Package className="w-6 h-6" />,
          color: getColorByIndex(index),
          count: 'Handmade items',
        }));

        setCategories(formatted);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };

    fetchCategories();
  }, []);

  const getColorByIndex = (index) => {
    const colors = [
      'from-pink-400 to-red-400',
      'from-yellow-400 to-orange-400',
      'from-green-400 to-emerald-500',
      'from-blue-400 to-indigo-500',
      'from-purple-400 to-pink-500',
      'from-red-400 to-yellow-400',
      'from-teal-400 to-cyan-400',
      'from-indigo-400 to-purple-400',
      'from-orange-400 to-pink-400',
      'from-rose-400 to-amber-400',
    ];
    return colors[index % colors.length];
  };

  return (
    <section className="py-20 bg-cream">
      <div className="container mx-auto px-4 ">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-black/90 mb-4">
            Shop by Category
          </h2>
          <p className="text-xl text-burgundy/70 max-w-2xl mx-auto">
            Explore our curated collection of handcrafted treasures
          </p>
        </motion.div>

        {/*Horizontal scrolling */}
        <motion.div
          className="flex gap-8 overflow-x-auto scroll-smooth snap-x snap-mandatory px-5 py-5 scrollbar-hide "
          style={{ WebkitOverflowScrolling: 'touch' }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          {categories.map((category, index) => (
            <motion.div
              key={category.categoryId}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ scale: 1.05, rotateY: 5 }}
              viewport={{ once: true }}
              className="group cursor-pointer snap-center min-w-[280px] max-w-[280px] flex-shrink-0"
            >
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-coral/10">
                <div
                  className={`w-16 h-16 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-300`}
                >
                  {category.icon}
                </div>
                <h3 className="text-xl font-semibold text-burgundy mb-2 group-hover:text-coral transition-colors">
                  {category.name}
                </h3>
                <p className="text-burgundy/60 mb-4">{category.productCount} items</p>
                  <motion.div
                    whileHover={{ x: 5 }}
                    className="flex items-center text-coral font-medium cursor-pointer"
                    onClick={() => navigate(`/shop?category=${encodeURIComponent(category.name)}`)}
                  >
                    Browse Collection
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </motion.div>

              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default ShopByCategory;
