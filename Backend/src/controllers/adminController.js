const Admin = require('../models/admin');
const User = require('../models/user');
const Artist = require('../models/artist');
const Customer = require('../models/customer');
const Product = require('../models/product');
const AuctionRequest = require('../models/auctionRequest');
const { firebase_db } = require('../config/firebase');
const { validationResult } = require('express-validator');
const sequelize = require('../config/db');
const Report = require('../models/report');
const ArtistFollow = require('../models/artistFollow');
const CustomizationResponse = require('../models/customizationResponse');
const bcrypt = require('bcrypt');

exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const admin = await Admin.findOne({ where: { userId } });
        
        if (!admin) {
            return res.status(404).json({ message: "Admin profile not found" });
        }
        
        return res.status(200).json({ admin });
    } catch (error) {
        console.error("Error getting admin profile:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const userId = req.user.id;
        const user = await User.findOne({ where: { userId } });
        
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ message: "Forbidden" });
        }
        
        const { name, username, phone } = req.body;
        
        if (!name || !username || !phone) {
            return res.status(400).json({
                message: "Please fill all required fields",
                required: ['name', 'username', 'phone']
            });
        }
        
        const existingAdmin = await Admin.findOne({ where: { userId } });
        
        if (existingAdmin) {
            if (existingAdmin.username !== username) {
                const usernameExists = await Admin.findOne({ where: { username } });
                if (usernameExists) {
                    return res.status(400).json({ message: "Username already exists" });
                }
            }
            
            await existingAdmin.update({ name, username, phone });
            return res.status(200).json({ admin: existingAdmin });
        } else {
            const usernameExists = await Admin.findOne({ where: { username } });
            if (usernameExists) {
                return res.status(400).json({ message: "Username already exists" });
            }
            
            const newAdmin = await Admin.create({ name, username, phone, userId });
            return res.status(201).json({ admin: newAdmin });
        }
    } catch (error) {
        console.error("Error updating admin profile:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

exports.getDashboardStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findOne({ where: { userId } });
        
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ message: "Forbidden: Admin access required" });
        }
        
        const [
            artistCount,
            customerCount,
            productCount,
            pendingAuctionRequests
        ] = await Promise.all([
            Artist.count(),
            Customer.count(),
            Product.count(),
            AuctionRequest.count({ where: { status: 'pending' } })
        ]);
        
        let auctionCount = 0;
        try {
            const auctionsRef = firebase_db.ref('auctions');
            const snapshot = await auctionsRef.once('value');
            const auctionsData = snapshot.val();
            auctionCount = auctionsData ? Object.keys(auctionsData).length : 0;
        } catch (firebaseError) {
            console.error('Firebase error:', firebaseError);
        }
        
        return res.status(200).json({
            message: "Dashboard statistics retrieved successfully",
            stats: {
                totalUsers: artistCount + customerCount,
                totalArtists: artistCount,
                totalCustomers: customerCount,
                totalProducts: productCount,
                totalAuctions: auctionCount,
                pendingAuctionRequests: pendingAuctionRequests
            }
        });
    } catch (error) {
        console.error("Error getting dashboard stats:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

exports.removeArtist = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { artistId } = req.params;
        const transaction = await sequelize.transaction();
        
        try {
            const artist = await Artist.findByPk(artistId, { transaction });
            
            if (!artist) {
                await transaction.rollback();
                return res.status(404).json({ message: "Artist not found" });
            }
            
            const user = await User.findByPk(artist.userId, { transaction });
            
            if (!user) {
                await transaction.rollback();
                return res.status(404).json({ message: "User not found for this artist" });
            }
            
            if (artist.profilePicture && artist.profilePicture.includes('cloudinary.com')) {
                try {
                    const cloudinary = require('../config/cloudinary');
                    const publicId = artist.profilePicture.split('/').slice(-1)[0].split('.')[0];
                    const folder = `artists/${artist.userId}/profilePicture`;
                    await cloudinary.uploader.destroy(`${folder}/${publicId}`);
                } catch (cloudinaryError) {
                    console.error('Error deleting profile picture from Cloudinary:', cloudinaryError);
                }
            }
            
            if (artist.profileVideo && artist.profileVideo.includes('cloudinary.com')) {
                try {
                    const cloudinary = require('../config/cloudinary');
                    const publicId = artist.profileVideo.split('/').slice(-1)[0].split('.')[0];
                    const folder = `artists/${artist.userId}/profileVideo`;
                    await cloudinary.uploader.destroy(`${folder}/${publicId}`, { resource_type: 'video' });
                } catch (cloudinaryError) {
                    console.error('Error deleting profile video from Cloudinary:', cloudinaryError);
                }
            }
            
            const customizationResponses = await CustomizationResponse.findAll({
                where: { artistId: artist.artistId },
                transaction
            });
            
            for (const response of customizationResponses) {
                if (response.image && response.image.includes('cloudinary.com')) {
                    try {
                        const cloudinary = require('../config/cloudinary');
                        const publicId = response.image.split('/').slice(-1)[0].split('.')[0];
                        const folder = `artists/${artist.userId}/customizationResponses`;
                        await cloudinary.uploader.destroy(`${folder}/${publicId}`);
                    } catch (cloudinaryError) {
                        console.error('Error deleting customization response image from Cloudinary:', cloudinaryError);
                    }
                }
            }
            
            const products = await Product.findAll({ 
                where: { artistId: artist.artistId },
                transaction
            });
            
            for (const product of products) {
                if (product.image && product.image.includes('cloudinary.com')) {
                    try {
                        const cloudinary = require('../config/cloudinary');
                        let images = product.image;
                        try {
                            images = JSON.parse(product.image);
                        } catch (e) {
                            images = [product.image];
                        }
                        
                        if (Array.isArray(images)) {
                            for (const imageUrl of images) {
                                if (imageUrl && imageUrl.includes('cloudinary.com')) {
                                    const publicId = imageUrl.split('/').slice(-1)[0].split('.')[0];
                                    const folder = `artists/${artist.userId}/products`;
                                    await cloudinary.uploader.destroy(`${folder}/${publicId}`);
                                }
                            }
                        }
                    } catch (cloudinaryError) {
                        console.error('Error deleting product images from Cloudinary:', cloudinaryError);
                    }
                }
            }
            
            const auctionRequests = await AuctionRequest.findAll({
                where: { artistId: artist.artistId },
                transaction
            });

            let hasActiveAuctions = false;
            for (const request of auctionRequests) {
                if (request.status === 'scheduled' && request.auctionId) {
                    try {
                        const auctionSnapshot = await firebase_db.ref(`auctions/${request.auctionId}`).once('value');
                        const auctionData = auctionSnapshot.val();
                        
                        if (auctionData && auctionData.status === 'active') {
                            hasActiveAuctions = true;
                            break;
                        }
                    } catch (firebaseError) {
                        console.error('Firebase error when checking auction status:', firebaseError);
                    }
                }
            }
            
            if (hasActiveAuctions) {
                await transaction.rollback();
                return res.status(400).json({ 
                    message: "Cannot remove artist with active auctions. Please wait for auctions to end." 
                });
            }

            for (const request of auctionRequests) {
                if (request.status === 'scheduled') {
                    try {
                        if (request.auctionId) {
                            const auctionSnapshot = await firebase_db.ref(`auctions/${request.auctionId}`).once('value');
                            const auctionData = auctionSnapshot.val();
                            if (auctionData && auctionData.status === 'scheduled') {
                                await firebase_db.ref(`auctions/${request.auctionId}`).remove();
                            }
                        }
                        await request.update({ 
                            status: 'rejected',
                            adminNotes: 'Auction rejected due to artist account removal'
                        }, { transaction });
                        
                    } catch (firebaseError) {
                        console.error('Firebase error when handling scheduled auction:', firebaseError);
                        await request.update({ 
                            status: 'rejected',
                            adminNotes: 'Auction rejected due to artist account removal'
                        }, { transaction });
                    }
                } else {
                    await request.destroy({ transaction });
                }
            }
            
            await CustomizationResponse.destroy({
                where: { artistId: artist.artistId },
                transaction
            });
            
            await ArtistFollow.destroy({
                where: { artistId: artist.artistId },
                transaction
            });
            
            await Report.destroy({
                where: { ReportedID: artist.artistId },
                transaction
            });
            
            for (const product of products) {
                await product.destroy({ transaction });
            }
            
            await artist.destroy({ transaction });
            
            await user.destroy({ transaction });
            
            await transaction.commit();
            
            return res.status(200).json({ message: "Artist and all associated data removed successfully" });
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    } catch (error) {
        console.error("Error removing artist:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

exports.addAdmin = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        const userId = req.user.id;
        const admin = await Admin.findOne({ where: { userId } });
        if(!admin){
            return res.status(403).json({ message: "You are not authorized to add an admin" });
        }
        
        const { name, email, password, username, phone } = req.body;
        if (!name || !email || !password || !username || !phone) {
            return res.status(400).json({
                message: "Please fill all required fields",
                required: ['name', 'email', 'password', 'username', 'phone']
            });
        }
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: "Email already exists" });
        }
        
        const existingAdmin = await Admin.findOne({ where: { username } });
        if (existingAdmin) {
            return res.status(400).json({ message: "Username already exists" });
        }
        const transaction = await sequelize.transaction();
        
        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            
            const newUser = await User.create({
                email,
                password: hashedPassword,
                role: 'admin',
                isEmailVerified: true,
            }, { transaction });
            
            const newAdmin = await Admin.create({
                name,
                username,
                phone,
                userId: newUser.userId
            }, { transaction });
            
            await transaction.commit();
            const adminResponse = {
                adminId: newAdmin.adminId,
                name: newAdmin.name,
                username: newAdmin.username,
                phone: newAdmin.phone,
                userId: newAdmin.userId
            };
            
            return res.status(201).json({ 
                message: "Admin created successfully",
                admin: adminResponse 
            });
            
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
        
    } catch (error) {
        console.error("Error adding admin:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};