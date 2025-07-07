const WelcomeSection = () => {
    return (
      <section className="flex flex-col md:flex-row items-center justify-between bg-[#FAF9F6] px-8 py-12 rounded-lg shadow-md pl-30 ">
      <div className="text-center md:text-left space-y-10 mt-[-30px]">
          <h1 className="text-4xl font-bold text-black mt-[-10px]">Welcome to Craftopia</h1>
          <p className="text-lg font-bold text-gray-800 pl-10">Where Art Meets Heart!</p>
  
          <div className="flex justify-center md:justify-start space-x-8">
  <button className="px-8 py-3 bg-[#E07385] text-white font-bold text-lg rounded-lg shadow-md hover:bg-[#7a162e] transition">
    Shop Now
  </button>
  <button className="px-8 py-3 border-2 border-[#E07385] text-black font-bold text-lg rounded-lg hover:bg-[#921A40] hover:text-white transition">
    Explore Artisans
  </button>
</div>

        </div>
        <div className="mt-6 md:mt-0 pr-60">
        <img
          src="https://m.media-amazon.com/images/I/81DcsqABleL._AC_UF1000,1000_QL80_.jpg"
          alt="Hand knitting art"
          className="w-[400px] md:w-[700px] lg:w-[800px] h-[300px] md:h-[500px] lg:h-[400px] rounded-lg shadow-md border-2 border-[#E07385] object-cover"
        />
      </div>
      

      </section>
    );
  };
  
  export default WelcomeSection;
  