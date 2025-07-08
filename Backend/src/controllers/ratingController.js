const { Rating, Artist, Customer } = require('../models');
const { Op } = require('sequelize');
const { validationResult } = require('express-validator');
const { updateArtistRating } = require('../utils/ratingUtils');
const addRating = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Validation errors',
                errors: errors.array()
            });
        }

        const { artistId, rating, comment } = req.body;
        const userId = req.user.id;
        
        const customer = await Customer.findOne({ where: { userId } });
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        const customerId = customer.customerId;

        const existingRating = await Rating.findOne({
            where: { customerId, artistId }
        });

        let ratingRecord;
        if (existingRating) {
            await existingRating.update({ rating, comment });
            ratingRecord = existingRating;
        } else {
            ratingRecord = await Rating.create({
                customerId,
                artistId,
                rating,
                comment
            });
        }
        
        await updateArtistRating(artistId);

        res.status(201).json({
            message: existingRating ? 'Rating updated successfully' : 'Rating added successfully',
            rating: ratingRecord
        });
    } catch (error) {
        console.error('Error adding/updating rating:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getArtistRatings = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Validation errors',
                errors: errors.array()
            });
        }

        const { artistId } = req.params;
        
        const artist = await Artist.findByPk(artistId,{
            attributes: ['artistId', 'name', 'username', 'profilePicture', 'averageRating', 'totalRatings']
        });
        if (!artist) {
            return res.status(404).json({ message: 'Artist not found' });
        }

        const ratings = await Rating.findAndCountAll({
            where: { artistId },
            include: [{
                model: Customer,
                attributes: ['name', 'username']
            }],
            order: [['createdAt', 'DESC']],
        });

        const avgRating = artist.averageRating ? Number(artist.averageRating) : 0;
        const formattedAvgRating = isNaN(avgRating) ? 0.00 : parseFloat(avgRating.toFixed(2));

        res.status(200).json({
            artist:{
                artistId: artist.artistId,
                name: artist.name,
                username: artist.username,
                profilePicture: artist.profilePicture,
                averageRating: formattedAvgRating,
                totalRatings: artist.totalRatings || 0
            },
            ratings: ratings.rows,
            totalRatings: ratings.count
        });
    } catch (error) {
        console.error('Error fetching artist ratings:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getCustomerRating = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Validation errors',
                errors: errors.array()
            });
        }

        const { artistId } = req.params;
        const userId = req.user.id;
        
        const customer = await Customer.findOne({ where: { userId } });
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        const customerId = customer.customerId;

        const rating = await Rating.findOne({
            where: { customerId, artistId }
        });

        if (!rating) {
            return res.status(404).json({ message: 'No rating found' });
        }

        res.status(200).json({ rating });
    } catch (error) {
        console.error('Error fetching customer rating:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = {
    addRating,
    getArtistRatings,
    getCustomerRating
};
