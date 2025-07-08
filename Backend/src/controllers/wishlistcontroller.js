const Customer = require('../models/customer');
const Wishlist = require('../models/wishlist');
const product = require('../models/product');
const Artist = require('../models/artist');
const category = require('../models/category');

exports.addtoWishlist = async (req, res) => {
    try {
        const userId = req.user.id; 
        const { productId } = req.params; 

        const customer = await Customer.findOne({ where: { userId } });
        if (!customer) {
            return res.status(403).json({ message: 'Customer not found' });
        }

        const productExists = await product.findByPk(productId);
        if (!productExists) {
            return res.status(404).json({ message: 'Product not found' });
        }

      
        const existingWishlistItem = await Wishlist.findOne({
            where: {
                customerId: customer.customerId,
                productId: productId
            }
        });

        if (existingWishlistItem) {
            return res.status(400).json({ message: 'Product already in wishlist' });
        }

        const wishlistItem = await Wishlist.create({
            customerId: customer.customerId,
            productId: productId
        });

        return res.status(201).json({
            message: 'Product added to wishlist successfully',
            wishlistItem
        });

    } catch (error) {
        console.error('Error adding to wishlist:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.getWishlist = async (req, res) => {
    try {
        const userId = req.user.id; 

        const customer = await Customer.findOne({ where: { userId } });
        if (!customer) {
            return res.status(403).json({ message: 'Customer not found' });
        }

        const wishlistItems = await Wishlist.findAll({
            where: { customerId: customer.customerId },
            include: [{
                model: product,
                as: 'product',
                include: [
                    {
                        model: category,
                        as: 'category',
                        attributes: [ 'name']
                    },
                    {
                        model: Artist,
                        as: 'artist',
                        attributes: ['name', 'username']
                    }
                ]
            }]
        });

        return res.status(200).json({
            message: 'Wishlist retrieved successfully',
            wishlistItems
        });

    } catch (error) {
        console.error('Error retrieving wishlist:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.removeFromWishlist = async (req, res) => {
    try {
         const userId = req.user.id; 
        const { productId } = req.params; 
        const customer = await Customer.findOne({ where: { userId } });
        if (!customer) {
            return res.status(403).json({ message: 'Customer not found' });
        }
        const wishlistItem = await Wishlist.findOne({
            where: {
                customerId: customer.customerId,
                productId: productId
            }
        });
        if (!wishlistItem) {
            return res.status(404).json({ message: 'Wishlist item not found' });
        }

        await wishlistItem.destroy();

        return res.status(200).json({ message: 'Product removed from wishlist successfully' });

    } catch (error) {
        console.error('Error removing from wishlist:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
