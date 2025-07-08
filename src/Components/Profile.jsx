import { useState, useEffect } from "react";
import CompleteProfile from "./CompleteProfile";

const Profile = ({ initialShowEdit = false, onProfileComplete, initialProfile }) => {
  const [profileData, setProfileData] = useState(initialProfile || null);
  const [loading, setLoading] = useState(!initialProfile);
  const [showEdit, setShowEdit] = useState(initialShowEdit);
  const [profileMissing, setProfileMissing] = useState(false);

  useEffect(() => {
    if (!initialProfile) {
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        fetch("http://localhost:3000/customer/getprofile", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        })
          .then((response) => {
            if (!response.ok) throw new Error("Failed to fetch profile");
            return response.json();
          })
          .then((data) => {
            if (!data.customerProfile || !data.customerProfile.name) {
              setProfileMissing(true);
            } else {
              setProfileData(data.customerProfile);
              setProfileMissing(false);
            }
            setLoading(false);
          })
          .catch((error) => {
            console.error("Error fetching profile:", error);
            setLoading(false);
            setProfileMissing(true);
          });
      } else {
        setLoading(false);
        setProfileMissing(true);
      }
    }
  }, [initialProfile]);

  const handleProfileUpdate = (updatedProfile) => {
    setProfileData(updatedProfile);
    if (onProfileComplete) onProfileComplete(updatedProfile);
    setShowEdit(false);
    setProfileMissing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full h-12 w-12 bg-[#F6EEEE]"></div>
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-[#F6EEEE] rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-[#F6EEEE] rounded"></div>
              <div className="h-4 bg-[#F6EEEE] rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showEdit) {
    return (
      <CompleteProfile
        onProfileComplete={handleProfileUpdate}
        initialProfile={profileData}
      />
    );
  }

  if (profileMissing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center bg-[#FAF9F6] transform -translate-y-10">

        <div className="w-full max-w-4xl bg-[#F6EEEE] border border-pink-200 p-16 rounded-[2rem] shadow-2xl backdrop-blur-md transition-all duration-300 flex flex-col items-center">
          <div className="text-7xl mb-4 bg-gradient-to-r from-[#D6336C] to-[#921A40] bg-clip-text text-transparent animate-bounce">
            👤
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4 tracking-tight">
            Profile Missing
          </h2>
          <p className="text-gray-700 mb-8 text-lg leading-relaxed max-w-2xl">
            Looks like you haven’t set up your profile yet. Let’s fix that to personalize your experience!
          </p>
          <button
            onClick={() => setShowEdit(true)}
            className="bg-[#921A40] text-white px-8 py-4 rounded-full font-semibold shadow-md hover:scale-105 transform transition-all duration-300"
          >
            Create Your Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
      <div className="bg-white rounded-3xl overflow-hidden shadow-2xl">
        <div className="relative h-48 bg-[#F6EEEE]">
          <div className="absolute -bottom-16 left-8">
            <div className="w-32 h-32 rounded-full border-4 border-white bg-[#921A40] flex items-center justify-center text-5xl font-bold text-white shadow-lg">
              {profileData?.name?.charAt(0).toUpperCase() || "U"}
            </div>
          </div>
        </div>
        <div className="pt-20 px-8 pb-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-4xl font-extrabold text-gray-900">
                {profileData?.name || "Name"}
              </h1>
              <p className="text-xl text-[#921A40] mt-2 font-medium">
                @{profileData?.username || "username"}
              </p>
            </div>
            <button
              onClick={() => setShowEdit(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-full border-2 border-[#E07385] text-[#E07385] font-semibold hover:bg-[#E07385] hover:text-white transition-all duration-300 hover:shadow-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
              Edit Profile
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#F6EEEE] p-6 rounded-xl border border-[#E07385]/20">
              <h3 className="text-xl font-semibold text-[#921A40] mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Contact Information
              </h3>
              <p className="text-gray-700 text-lg">{profileData?.phone || "Not provided"}</p>
            </div>

            <div className="bg-[#F6EEEE] p-6 rounded-xl border border-[#E07385]/20">
              <h3 className="text-xl font-semibold text-[#921A40] mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Address
              </h3>
              <p className="text-gray-700 text-lg">{profileData?.address || "Not provided"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;