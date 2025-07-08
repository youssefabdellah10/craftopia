import { useState, useEffect, useRef } from "react";

const EditProfile = () => {
    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [phone, setPhone] = useState("");
    const [biography, setBiography] = useState("");
    const [profilePicturePreview, setProfilePicturePreview] = useState("");
    const [profileVideoPreview, setProfileVideoPreview] = useState("");
    const [profilePictureFile, setProfilePictureFile] = useState(null);
    const [profileVideoFile, setProfileVideoFile] = useState(null);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const pictureInputRef = useRef(null);
    const videoInputRef = useRef(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await fetch("http://localhost:3000/artist/myprofile", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                });

                if (!response.ok) throw new Error("Failed to fetch profile");

                const data = await response.json();
                const artist = data.ArtistProfile;

                setName(artist.name || "");
                setUsername(artist.username || "");
                setPhone(artist.phone || "");
                setBiography(artist.biography || "");
                setProfilePicturePreview(artist.profilePicture || "");
                setProfileVideoPreview(artist.profileVideo || "");
            } catch (err) {
                console.error(err);
            }

        };

        fetchProfile();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!profileVideoFile && !profileVideoPreview) {
            setMessage("Please upload a profile video showing your handmade items.");
            return;
        }

        setLoading(true);
        setMessage("");

        const formData = new FormData();
        formData.append("name", name);
        formData.append("username", username);
        formData.append("phone", phone);
        formData.append("biography", biography);
        if (profilePictureFile) formData.append("profilePicture", profilePictureFile);
        if (profileVideoFile) formData.append("profileVideo", profileVideoFile);

        try {
            const response = await fetch("http://localhost:3000/artist/update", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.message === "Username already exists") {
                    setMessage("Username already exists. Please choose a different one.");
                } else {
                    setMessage("Failed to update profile.");
                }
                setLoading(false);
                return;
            }

            if (data.artist && data.artist.artistId) {
                localStorage.setItem("artistId", data.artist.artistId);
            }

            setMessage("Profile updated successfully.");
        } catch (err) {
            console.error(err);
            setMessage("Failed to update profile.");
        } finally {
            setLoading(false);
        }

    };


    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        if (type === "picture") {
            setProfilePictureFile(file);
            setProfilePicturePreview(URL.createObjectURL(file));
        } else if (type === "video") {
            setProfileVideoFile(file);
            setProfileVideoPreview(URL.createObjectURL(file));
        }
    };

    return (
        <form onSubmit={handleSubmit} className="max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row gap-8">
                <div className="w-full md:w-1/3">
                    <div className="bg-[#F6EEEE] p-6 rounded-lg shadow-md">
                        <div className="flex flex-col items-center">
                            <div className="relative mb-4">
                                <div className="relative mb-4">
                                    {profilePicturePreview ? (
                                        <img
                                            src={profilePicturePreview}
                                            alt="Profile"
                                            className="w-40 h-40 rounded-full object-cover border-4 border-[#E07385] shadow-lg"
                                        />
                                    ) : (
                                        <div className="w-40 h-40 rounded-full border-4 border-[#E07385] shadow-lg flex items-center justify-center bg-gray-200 text-[#E07385] text-6xl font-bold select-none">
                                            {name
                                                ? name
                                                    .split(" ")
                                                    .map((n) => n[0])
                                                    .join("")
                                                    .toUpperCase()
                                                : "?"}
                                        </div>
                                    )}

                                    <input
                                        type="file"
                                        accept="image/*"
                                        ref={pictureInputRef}
                                        onChange={(e) => handleFileChange(e, "picture")}
                                        className="hidden"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => pictureInputRef.current.click()}
                                        className="absolute -bottom-2 right-0 bg-[#E07385] text-white px-4 py-1 rounded-full text-sm font-medium shadow-md hover:bg-[#921A40] transition"
                                    >
                                        Change
                                    </button>
                                </div>
                            </div>
                            <div className="w-full space-y-4">
                                <div>
                                    <label className="block mb-1 font-semibold text-black">
                                        Name <span className="text-red-600">*</span>
                                    </label>
                                    <input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block mb-1 font-semibold text-black">
                                        Username <span className="text-red-600">*</span>
                                    </label>
                                    <input
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded"
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-full md:w-2/3 space-y-4">
                    <div className="bg-[#F6EEEE] p-6 rounded-lg shadow-md">
                        <div className="space-y-4">
                            <div>
                                <label className="block mb-1 font-semibold text-black">
                                    Phone <span className="text-red-600">*</span>
                                </label>
                                <input
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block mb-1 font-semibold text-black">
                                    Biography <span className="text-red-600">*</span>
                                </label>
                                <textarea
                                    value={biography}
                                    onChange={(e) => setBiography(e.target.value)}
                                    rows={4}
                                    maxLength={400}
                                    className="w-full px-3 py-2 border border-gray-300 rounded"
                                    required
                                />
                                <p className="text-sm text-gray-500 mt-1 text-right">
                                    {biography.length}/400 characters
                                </p>
                            </div>


                            <div>
                                <label className="block font-semibold text-black mb-1">
                                    Profile Video <span className="text-red-500">*</span>
                                </label>
                                <p className="text-sm text-gray-500 mb-2">
                                    Please upload a short video showing <span className="font-medium text-[#921A40]">handmade items</span> you've created.
                                </p>

                                <div className="flex items-center gap-4">
                                    <label
                                        onClick={() => videoInputRef.current.click()}
                                        className="cursor-pointer inline-flex items-center gap-2 bg-[#E07385] text-white px-4 py-2 rounded hover:bg-[#921A40] transition"
                                    >
                                        🎬 {profileVideoPreview ? "Update Video" : "Add Video"}
                                    </label>
                                    <input
                                        type="file"
                                        accept="video/*"
                                        ref={videoInputRef}
                                        onChange={(e) => handleFileChange(e, "video")}
                                        className="hidden"
                                    />
                                </div>

                                {profileVideoPreview && (
                                    <video
                                        src={profileVideoPreview}
                                        controls
                                        className="w-64 h-36 mt-4 rounded-lg border border-gray-300 object-contain"
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    {message && (
                        <div className={`p-3 rounded-lg ${message.includes("success")
                            ? "bg-green-50 text-green-600"
                            : "bg-red-50 text-red-600"}`}>
                            <p className="text-sm font-medium">{message}</p>
                        </div>
                    )}
                    <button
                        type="submit"
                        disabled={loading}
                        className={`px-6 py-2 rounded-full font-semibold text-white shadow-md transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E07385]
    ${loading
                                ? "bg-[#921A40] cursor-not-allowed"
                                : "bg-[#E07385] hover:bg-[#921A40] active:scale-95"}
  `}
                    >
                        {loading ? "Uploading..." : "Save Changes"}
                    </button>

                </div>
            </div>
        </form>
    );
};

export default EditProfile;
