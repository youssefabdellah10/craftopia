import { useState } from "react";
import { motion } from "framer-motion";

const CompleteProfile = ({ onClose, onProfileComplete, initialProfile }) => {
  const [name, setName] = useState(initialProfile?.name || "");
  const [username, setUsername] = useState(initialProfile?.username || "");
  const [phone, setPhone] = useState(initialProfile?.phone || "");
  const [address, setAddress] = useState(initialProfile?.address || "");

  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const validateFields = () => {
    const errors = {};
    if (!name.trim()) errors.name = "Name is required.";
    if (!username.trim()) errors.username = "Username is required.";
    if (!phone.trim()) errors.phone = "Phone is required.";
    if (!address.trim()) errors.address = "Address is required.";
    return errors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = validateFields();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Please fill in all fields correctly.");
      setSuccessMessage("");
      return;
    }

    const profileData = { name, username, phone, address };
    const token = localStorage.getItem("token");

    fetch("http://localhost:3000/customer/createprofile", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(profileData),
    })
      .then(async (res) => {
        const data = await res.json();

        if (!res.ok) {
          if (data.message === "Username already exists") {
            setFieldErrors({ username: "Username already exists. Please choose another one." });
            setError("Username already exists.");
          } else {
            setError("Failed to update profile.");
          }
          setSuccessMessage("");
          return;
        }

        setSuccessMessage("Profile updated successfully!");
        setError("");
        setFieldErrors({});
        onProfileComplete(data.customerProfile || data.existingCustomer);
        setTimeout(() => {
          onClose();
        }, 2000);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to update profile.");
        setSuccessMessage("");
      });

  };

  return (
    <div className="p-2 sm:p-4 md:p-6 bg-[#F6EEEE]">
      <div className="grid md:grid-cols-2 gap-8 items-start bg-white p-8 rounded-2xl shadow-xl border border-[#f9d2d9] max-w-6xl mx-auto">
        <div>
          <h2 className="text-3xl font-bold text-black mb-6">
            Complete Your Profile
          </h2>

          {successMessage && (
            <p className="text-green-600 mb-4 font-semibold">{successMessage}</p>
          )}
          {error && (
            <p className="text-red-500 mb-4 font-semibold">{error}</p>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block font-semibold text-sm text-[#7a162e] mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-[#f3c7ce] rounded-lg text-gray-700 placeholder-gray-400 shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#E07385]"
              />
              {fieldErrors.name && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.name}</p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-sm text-[#7a162e] mb-2">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-[#f3c7ce] rounded-lg text-gray-700 placeholder-gray-400 shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#E07385]"
              />
              {fieldErrors.username && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.username}</p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-sm text-[#7a162e] mb-2">
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 border border-[#f3c7ce] rounded-lg text-gray-700 placeholder-gray-400 shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#E07385]"
              />
              {fieldErrors.phone && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.phone}</p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-sm text-[#7a162e] mb-2">
                Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-3 border border-[#f3c7ce] rounded-lg text-gray-700 placeholder-gray-400 shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#E07385]"
              />
              {fieldErrors.address && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.address}</p>
              )}
            </div>

            <div className="flex justify-end mt-4">
              <button
                type="submit"
                className="bg-[#E07385] text-white py-2 px-6 rounded-lg font-semibold hover:bg-[#7a162e] transition"
              >
                Save
              </button>
            </div>
          </form>
        </div>

        <div className="hidden md:flex justify-center mt-10">
          <motion.img
            src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"//https://cdn-icons-png.flaticon.com/512/1077/1077114.png
            alt="Profile Illustration"
            className="w-full max-w-sm"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            whileHover={{ scale: 1.05 }}
          />
        </div>
      </div>
    </div>
  );
};

export default CompleteProfile;
