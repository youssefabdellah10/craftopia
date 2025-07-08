const Category = require('../models/category');
const categoryRequests = require('../models/categoriesRequests');
const Artist = require('../models/artist');
const Product = require('../models/product');

exports.createCategory = async (req, res) => {
    try {
        const {name} = req.body;
        if(!name) {
            return res.status(400).json({message: 'Please provide all required fields'});
        }
        const existingCategory = await Category.findOne({where: {name}});
        if(existingCategory) {
            return res.status(400).json({message: `Category "${name}" already exists`});
        }
        const category = await Category.create({name});

        res.status(201).json({category});
    } catch (error) {
        res.status(500).json({message: error.message});
    }
}

exports.getAllCategories = async (req, res) => {
    try {
        const categories = await Category.findAll({
            include: [{
                model: Product,
                attributes: [],
                required: false,
                where: {
                    type: 'normal'
                }
            }],
            attributes: [
                'categoryId',
                'name',
                [require('sequelize').fn('COUNT', require('sequelize').col('products.productId')), 'productCount']
            ],
            group: ['category.categoryId', 'category.name'],
            raw: true
        });
        
        res.status(200).json({categories});
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({message: error.message});
    }
}

exports.requestCategory = async (req, res) => {
    try {
        const {name} = req.body;
        if(!name) {
            return res.status(400).json({message: 'Please provide a category name'});
        }
        const artist = await Artist.findOne({where: {userId: req.user.id}});
        if (!artist) {
            return res.status(404).json({message: 'Artist profile not found. Please complete your artist profile first.'});
        }
        
        const categoryExists = await Category.findOne({where: {name}});
        if(categoryExists) {
            return res.status(400).json({message: `Category "${name}" already exists`});
        }
        const existingRequest = await categoryRequests.findOne({
            where: {
                artistId: artist.artistId,
                name: name
            }
        });

        if(existingRequest) {
            return res.status(400).json({message: `You already requested this category: "${name}"`});
        }
        const otherUserRequest = await categoryRequests.findOne({
            where: {name: name}
        });        
        if(otherUserRequest) {
            otherUserRequest.counter += 1;
            await otherUserRequest.save();
            return res.status(200).json({message: `Category request for "${name}" updated. Counter incremented.`});
        }
        
        const categoryRequest = await categoryRequests.create({
            artistId: artist.artistId,
            name,
            status: 'pending',
            counter: 1
        });

        res.status(200).json({message: `Category request for "${name}" received`});
    } catch (error) {
        console.error('Error requesting category:', error);
        res.status(500).json({message: error.message});
    }
}

exports.getRequestedCategories = async (req, res) => {
    try {
        const requestedCategories = await categoryRequests.findAll({
            attributes: ['name', 'counter', 'createdAt'],
            order: [['counter', 'DESC']],
        });
        res.status(200).json({requestedCategories});
    } catch (error) {
        console.error('Error fetching requested categories:', error);
        res.status(500).json({message: error.message});
    }   
}