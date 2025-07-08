import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const AdminProfile = () => {
    const [profile, setProfile] = useState({
        name: '',
        username: '',
        phone: ''
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    const fetchProfile = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get('http://localhost:3000/admin/profile', {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (response.data && response.data.admin) {
                const { name, username, phone } = response.data.admin;
                setProfile({
                    name: name || '',
                    username: username || '',
                    phone: phone || ''
                });
            } else {
                toast.error('No admin data found');
            }
        } catch (error) {
            console.error('Error fetching admin profile:', error);
            toast.error('Failed to fetch profile');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    const handleSubmit = async () => {
        try {
            await axios.post('http://localhost:3000/admin/profile/update', profile, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            toast.success('Profile updated successfully!');
            setIsEditing(false);
            fetchProfile();
        } catch (error) {
            console.error('Error saving profile:', error);
            toast.error('Failed to update profile');
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    if (isLoading) {
        return (
            <div className="flex min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--color-burgundy)]"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full px-6">
                <div className="bg-white rounded-2xl shadow-md overflow-hidden">
                    <div className="bg-[#F6EEEE] p-6 sm:p-8 text-black">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold">Admin Profile</h1>
                                <p className="opacity-90 mt-1">Manage your account details</p>
                            </div>
                            <div className="bg-white/20 p-3 rounded-full">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    <div className="p-6 sm:p-8">
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                                    {isEditing ? (
                                        <input
                                            name="name"
                                            value={profile.name}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-burgundy)] focus:border-transparent transition"
                                            placeholder="Enter your name"
                                        />
                                    ) : (
                                        <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-800">{profile.name || 'Not provided'}</div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">Username</label>
                                    {isEditing ? (
                                        <input
                                            name="username"
                                            value={profile.username}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-burgundy)] focus:border-transparent transition"
                                            placeholder="Enter username"
                                        />
                                    ) : (
                                        <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-800">{profile.username || 'Not provided'}</div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                                    {isEditing ? (
                                        <input
                                            name="phone"
                                            value={profile.phone}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-burgundy)] focus:border-transparent transition"
                                            placeholder="Enter phone number"
                                        />
                                    ) : (
                                        <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-800">{profile.phone || 'Not provided'}</div>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end space-x-4 pt-4">
                                {isEditing ? (
                                    <>
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSubmit}
                                            className="px-6 py-2.5 bg-[var(--color-burgundy)] text-white rounded-lg hover:bg-[var(--color-coral)] transition shadow-md"
                                        >
                                            Save Changes
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="px-6 py-2.5 bg-[var(--color-burgundy)] text-white rounded-lg hover:bg-[var(--color-coral)] transition shadow-md"
                                    >
                                        Edit Profile
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow border-l-4 border-[var(--color-burgundy)]">
                        <h3 className="text-gray-500 text-sm font-medium">Admin Since</h3>
                        <p className="text-2xl font-bold mt-1">Jan 2023</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow border-l-4 border-[var(--color-coral)]">
                        <h3 className="text-gray-500 text-sm font-medium">Last Updated</h3>
                        <p className="text-2xl font-bold mt-1">Today</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow border-l-4 border-green-500">
                        <h3 className="text-gray-500 text-sm font-medium">Account Status</h3>
                        <p className="text-2xl font-bold mt-1 text-green-500">Active</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminProfile;
