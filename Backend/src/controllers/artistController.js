const Artist = require('../models/artist');
const { uploadBuffer } = require('../utils/cloudinaryUpload');
const User = require('../models/user');
const { Op, Sequelize } = require('sequelize');
const { validationResult } = require('express-validator');
const Product = require('../models/product');
const ArtistFollow = require('../models/artistFollow');
const Customer = require('../models/customer');
const Category = require('../models/category');
const Review = require('../models/Review');
const sequelize = require('../config/db');

exports.updateArtist = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const userId = req.user.id;

        const { name, username, phone, biography } = req.body;

        if (username) {
            const existingArtist = await Artist.findOne({
                where: {
                    username,
                    userId: { [Op.ne]: userId }
                }
            });

            if (existingArtist) {
                return res.status(400).json({ message: 'Username already exists' });
            }
        }

        let profilePicture = '';
        let profileVideo = '';

        const uploadPromises = [];

        if (req.files) {
            if (req.files.profilePicture && req.files.profilePicture[0]) {
                const pictureFile = req.files.profilePicture[0];
                uploadPromises.push(
                    uploadBuffer(pictureFile.buffer, {
                        folder: `artists/${userId}/profilePicture`,
                        resource_type: 'image'
                    }).then(result => {
                        profilePicture = result.secure_url;
                    })
                );
            }

            if (req.files.profileVideo && req.files.profileVideo[0]) {
                const videoFile = req.files.profileVideo[0];
                uploadPromises.push(
                    uploadBuffer(videoFile.buffer, {
                        folder: `artists/${userId}/profileVideo`,
                        resource_type: 'video'
                    }).then(result => {
                        profileVideo = result.secure_url;
                    })
                );
            }
            if (uploadPromises.length > 0) {
                await Promise.all(uploadPromises);
            }
        }

        const [artist, created] = await Artist.findOrCreate({
            where: { userId },
            defaults: {
                name: name || '',
                username: username || '',
                phone: phone || '',
                biography: biography || '',
                profilePicture: profilePicture || '',
                profileVideo: profileVideo || '',
                userId
            }
        });

        if (!created) {
            const updates = {};
            if (name) updates.name = name;
            if (username) updates.username = username;
            if (phone) updates.phone = phone;
            if (biography) updates.biography = biography;
            if (profilePicture) updates.profilePicture = profilePicture;
            if (profileVideo) updates.profileVideo = profileVideo;

            await artist.update(updates);
        }

        return res.status(created ? 201 : 200).json({ artist });

    } catch (error) {
        console.error('Error updating artist:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

exports.getArtist = async (req, res) => {
    try {
        const { artistId } = req.params;

        const artist = await Artist.findOne({
            where: { artistId },
            include: [{
                model: Product,
                attributes: ['categoryId'],
                include: [{
                    model: Category,
                    attributes: ['categoryId', 'name'],
                }],
                required: false
            }]
        });

        if (!artist) {
            return res.status(404).json({ message: 'Artist profile not found' });
        }
        const categoryMap = new Map();
        if (artist.products) {
            artist.products.forEach(product => {
                if (product.category) {
                    const categoryId = product.category.categoryId;
                    if (categoryMap.has(categoryId)) {
                        categoryMap.get(categoryId).productCount++;
                    } else {
                        categoryMap.set(categoryId, {
                            categoryId: product.category.categoryId,
                            name: product.category.name,
                            productCount: 1
                        });
                    }
                }
            });
        }
        const categories = Array.from(categoryMap.values());
        const numberOfFollowers = await ArtistFollow.count({
            where: { artistId: artist.artistId }
        });
        const numberOfProducts = await Product.count({
            where: { artistId: artist.artistId }
        });

        const userId = req.user?.id;
        if (userId) {
            const user = await User.findOne({ where: { userId } });
            if (user && user.role === 'customer') {
                await artist.increment('visitors');
            }
        }
        const artistData = artist.toJSON();
        delete artistData.products;

        return res.status(200).json({
            artist: {
                ...artistData,
                numberOfFollowers,
                numberOfProducts,
                categories
            }
        });
    } catch (error) {
        console.error('Error fetching artist profile:', error);
        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};


exports.getAllArtists = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const userId = req.user?.id;
        const customer = userId ? await Customer.findOne({ where: { userId } }) : null;

        let artists = await Artist.findAll({
            attributes: [
                'artistId',
                'name',
                'username',
                'profilePicture',
                'biography',
                'createdAt',
                [Sequelize.fn('COUNT', Sequelize.fn('DISTINCT', Sequelize.col('products.productId'))), 'numberOfProducts'],
                [Sequelize.fn('COUNT', Sequelize.fn('DISTINCT', Sequelize.col('artistfollows.customerId'))), 'numberOfFollowers'],
                'averageRating',
                [
                    Sequelize.literal(`(
            SELECT COALESCE(MIN("products"."price"), 0)
            FROM "products" AS "products"
            WHERE "products"."artistId" = "artist"."artistId"
          )`),
                    'lowestPrice'
                ]
            ],
            include: [
                {
                    model: User,
                    attributes: ['userId', 'email', 'isBanned'],
                },
                {
                    model: Product,
                    attributes: [],
                    required: false
                },
                {
                    model: ArtistFollow,
                    attributes: [],
                    required: false
                }
            ],
            group: ['artist.artistId', 'user.userId'],
            order: [['artistId', 'DESC']]
        });

        const artistsWithExtras = await Promise.all(
            artists.map(async (artist) => {

                const isFollowing = customer
                    ? await ArtistFollow.findOne({
                        where: {
                            artistId: artist.artistId,
                            customerId: customer.customerId
                        }
                    }) !== null
                    : false;

                const artistCategories = await Product.findAll({
                    where: { artistId: artist.artistId },
                    include: [
                        {
                            model: Category,
                            attributes: ['categoryId', 'name'],
                            required: true
                        }
                    ],
                    attributes: ['categoryId'],
                    group: ['product.categoryId', 'category.categoryId', 'category.name']
                });

                const categoryNames = artistCategories
                    .map((product) => (product.category ? product.category.name : null))
                    .filter((name) => name !== null);

                const totalReviews = await Review.count({
                    include: [
                        {
                            model: Product,
                            where: { artistId: artist.artistId },
                            attributes: []
                        }
                    ]
                });
                const user = artist.user || {};
                return {
                    artistId: artist.artistId,
                    name: artist.name,
                    username: artist.username,
                    profilePicture: artist.profilePicture,
                    biography: artist.biography,
                    createdAt: artist.createdAt,
                    averageRating: artist.averageRating,
                    numberOfProducts: artist.dataValues.numberOfProducts,
                    numberOfFollowers: artist.dataValues.numberOfFollowers,
                    lowestPrice: artist.dataValues.lowestPrice,
                    email: user.email,
                    userId: user.userId,
                    banned: user.isBanned || false,
                    isFollowing,
                    categories: categoryNames,
                    totalReviews: totalReviews || 0
                };
            })
        );

        return res.status(200).json({ artists: artistsWithExtras });
    } catch (error) {
        console.error('Error fetching artists:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


exports.getArtistFollowers = async (req, res) => {
    try {
        const { artistId } = req.params;

        const artist = await Artist.findByPk(artistId);
        if (!artist) {
            return res.status(404).json({ message: 'Artist not found' });
        }

        const followersCount = await ArtistFollow.count({
            where: { artistId }
        });

        const followers = await ArtistFollow.findAll({
            where: { artistId },
            include: [{
                model: Customer,
                attributes: ['customerId', 'name', 'username']
            }]
        });

        return res.status(200).json({
            followersCount,
            followers: followers.map(follow => follow.customer)
        });
    } catch (error) {
        console.error('Error getting artist followers:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const ArtistProfile = await Artist.findOne({ where: { userId } });
        if (!ArtistProfile) {
            return res.status(404).json({ message: "Artist profile not found" });
        }
        return res.status(200).json({ ArtistProfile });
    } catch (error) {
        console.error("Error getting Artist profile:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

exports.getArtistByName = async (req, res) => {
    try {
        const { name } = req.params;

        if (!name) {
            return res.status(400).json({ message: "Artist name is required" });
        }

        const artist = await Artist.findOne({
            where: { name },
            include: [
                {
                    model: User,
                    attributes: ['userId', 'email', 'isBanned']
                },
                {
                    model: Product,
                    include: [
                        {
                            model: Category,
                            attributes: ['categoryId', 'name'],
                        }
                    ]
                }
            ]
        });

        if (!artist) {
            return res.status(404).json({ message: "Artist not found" });
        }

        const numberOfFollowers = await ArtistFollow.count({
            where: { artistId: artist.artistId }
        });

        const numberOfProducts = await Product.count({
            where: { artistId: artist.artistId }
        });

        const categoryMap = new Map();
        if (artist.products) {
            artist.products.forEach(product => {
                if (product.category) {
                    const catId = product.category.categoryId;
                    if (categoryMap.has(catId)) {
                        categoryMap.get(catId).productCount++;
                    } else {
                        categoryMap.set(catId, {
                            categoryId: product.category.categoryId,
                            name: product.category.name,
                            productCount: 1
                        });
                    }
                }
            });
        }

        const categories = Array.from(categoryMap.values());

        return res.status(200).json({
            artist: {
                ...artist.toJSON(),
                numberOfFollowers,
                numberOfProducts,
                categories
            }
        });

    } catch (error) {
        console.error("Error fetching artist by name:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
