import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <motion.section
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="relative gradient-bg py-20 overflow-hidden"
    >
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-8"
          >
            <div>
              <h1 className="text-4xl md:text-6xl font-bold text-black mb-6 leading-tight">
                Discover
                <span className="block text-coral">Handmade</span>
                Treasures
              </h1>
              <p className="text-lg text-black/80 mb-8 max-w-lg">
                Connect with talented artisans and find unique, handcrafted pieces that tell a story.
                Support local artists and bring authentic craftsmanship into your home.
              </p>
            </div>

            
            <div className="flex flex-col sm:flex-row gap-4">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 4px 15px rgba(233,75,60,0.4)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/shop')}
                className="bg-coral hover:bg-coral/80 text-cream px-8 py-3 text-lg font-medium rounded-lg transition-all duration-300"
              >
                Shop Now
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 4px 15px rgba(114,47,55,0.3)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/artists')}
                className="border border-burgundy text-burgundy hover:bg-burgundy hover:text-cream px-8 py-3 text-lg rounded-lg font-semibold transition-all duration-300 shadow-lg "
              >
                Explore Artisans
              </motion.button>
            </div>
          </motion.div>

          {/* Right Column  */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <motion.img
                  whileHover={{ scale: 1.05 }}
                  src="https://plus.unsplash.com/premium_photo-1677621683737-3e92745fc7a2?w=600&auto=format&fit=crop&q=60"
                  alt="Handmade pottery"
                  className="rounded-lg shadow-lg"
                />
                <motion.img
                  whileHover={{ scale: 1.05 }}
                  src="https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?q=80&w=2070&auto=format&fit=crop"
                  alt="Artisan jewelry"
                  className="rounded-lg shadow-lg"
                />
              </div>
              <div className="space-y-4 pt-8">
                <motion.img
                  whileHover={{ scale: 1.05 }}
                  src="https://images.unsplash.com/photo-1609881583302-61548332039c?q=80&w=2088&auto=format&fit=crop"
                  alt="Handwoven textiles"
                  className="rounded-lg shadow-lg"
                />
                <motion.img
                  whileHover={{ scale: 1.05 }}
                  src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop"
                  alt="Wood crafts"
                  className="rounded-lg shadow-lg"
                />
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-coral/20 rounded-full animate-pulse"></div>
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-burgundy/20 rounded-full animate-pulse delay-1000"></div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
};

export default HeroSection;
