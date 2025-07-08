const Product = require('../models/product');
const Category = require('../models/category');
const Artist = require('../models/artist');
const { uploadBuffer, deleteImagesByPublicIds } = require('../utils/cloudinaryUpload');
const Review = require('../models/Review');
const { Sequelize } = require('sequelize');
const AuctionRequest = require('../models/auctionRequest');
const { Admin } = require('../models');

exports.createProduct = async (req, res) => {
    try {
        const userId = req.user.id;
        const artist = await Artist.findOne({where:{userId}});
        if(!artist) {
            return res.status(403).json({message: 'You are not authorized to create a product'});
        }

        const {name, description, price, categoryName, quantity,dimension,material,type} = req.body;
        if(!name || !description || !price || !categoryName || !quantity || !dimension || !material) {
            return res.status(400).json({
                message: 'Please provide all required fields',
                required: ['name', 'description', 'price', 'categoryName', 'quantity']
            });
        }

        const files = req.files;

        if(!files || files.length < 1){
            return res.status(400).json({message: 'Please provide at least one image'});
        }

        if(files.length > 5){
            return res.status(400).json({message: 'You can only upload a maximum of 5 images'});
        }

        const uploadPromises = files.map(file => 
            uploadBuffer(file.buffer, {
                folder: `artists/${artist.userId}/products`,
                resource_type: 'image'
            })
        );
        
        const uploadResults = await Promise.all(uploadPromises);
        const images = uploadResults.map(result => result.secure_url);

        const category = await Category.findOne({where:{name:categoryName}});
        if(!category) {
            return res.status(400).json({message: 'Category does not exist'});
        }
        let newquantity = quantity;
        if(type == 'customizable' || type == 'auction') {
            newquantity = 1;
        }
        const product = await Product.create({
            name,
            description,
            price,
            image: images,
            categoryId: category.categoryId,
            artistId: artist.artistId,
            quantity: newquantity,
            dimensions: dimension,
            material: material,
            type: type || 'normal',
        });

        res.status(201).json({product});
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({message: 'Internal server error'});
    }
}

exports.getProducts = async (req, res) => {
    try {
        const { type } = req.query;
        const whereClause = {};
        if (type) {
            whereClause.type = type;
        }
        const products = await Product.findAll({
            where: whereClause,
            include: [
                { model: Category, attributes: ['name'] },
                { model: Artist, attributes: ['artistId','name'] }
            ],
            attributes: ['productId', 'name', 'price', 'description', 'image', 'sellingNumber', 'quantity', 'dimensions', 'material','createdAt','type']
        });

        const filteredProducts= [];
        for (const product of products) {
            if (product.type === 'auction') {
                const auctionRequest = await AuctionRequest.findOne({ 
                    where: { 
                        productId: product.productId,
                        status: 'scheduled'
                    } 
                });
                if (auctionRequest) {
                    filteredProducts.push(product);
                }
            } else {
                filteredProducts.push(product);
            }
        }

        const productsWithStats = await Promise.all(
            filteredProducts.map(async (product) => {
                const reviewStats = await Review.findOne({
                    where: { productId: product.productId },
                    attributes: [
                        [Sequelize.fn('COUNT', Sequelize.col('reviewId')), 'totalReviews'],
                        [Sequelize.fn('AVG', Sequelize.col('rating')), 'averageRating']
                    ],
                    raw: true
                });

                const productData = product.toJSON();
                return {
                    ...productData,
                    totalReviews: parseInt(reviewStats?.totalReviews) || 0,
                    averageRating: reviewStats?.averageRating ? parseFloat(reviewStats.averageRating).toFixed(2) : null
                };
            })
        );

        res.status(200).json({ 
            products: productsWithStats,
            totalProducts: productsWithStats.length
         });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


exports.updateProduct = async (req, res) => {
    try {
        const userId = req.user.id;
        const artist = await Artist.findOne({where:{userId}});
        if(!artist) {
            return res.status(400).json({message: 'You are not authorized to update a product'});
        }
        const productId = req.params.productId;
        const product = await Product.findOne({where:{productId}});
        if(!product) {
            return res.status(404).json({message: 'Product not found'});
        }
        if(product.artistId !== artist.artistId) {
            return res.status(403).json({message: 'Forbidden'});
        }
        const {name, description, price,  quantity,dimensions,material} = req.body;
        if(product.type !== 'normal') {
            return res.status(400).json({
                message: `Cannot update ${product.type} products. Only normal products can be updated.`
            });
        }
        if(quantity && (isNaN(quantity) || quantity < 0)) {
            return res.status(400).json({message: 'Stock must be a non-negative integer'});
        }
        product.name = name || product.name;
        product.description = description || product.description;
        product.price = price || product.price;
        product.quantity = quantity || product.quantity;
        product.dimensions = dimensions || product.dimensions;
        product.material = material || product.material;
        await product.save();


        let image = undefined;
        if (req.files && req.files.image && req.files.image.length > 0) {
          const imageFile = req.files.image[0];
          const result = await uploadBuffer(imageFile.buffer, {
            folder: `artists/${artist.userId}/products`,
            resource_type: 'image'
          });
          image = result.secure_url;
        }
        if (image) {
          product.image = image;
          await product.save();
        }

        res.status(200).json({product});
    } catch (error) {
        res.status(500).json({message: error.message});
    }
}

exports.getArtistProducts = async (req, res) => {
  try {
    const artistId = req.params.artistId;
    const artist = await Artist.findOne({ where: { artistId } });

    if (!artist) {
      return res.status(403).json({ message: 'Artist not found' });
    }

    const products = await Product.findAll({
      where: { artistId: artist.artistId },
      attributes: ['productId', 'name', 'price', 'description', 'image', 'quantity', 'dimensions', 'material', 'type'],
      include: [
        {
          model: Category,
          attributes: ['categoryId', 'name'],
        },
      ],
    });

    const normalProducts = [];
    const auctionProducts = [];
    const customizableProducts = [];

    for (const product of products) {
      if (product.type === 'auction') {
        const auctionRequest = await AuctionRequest.findOne({ where: { productId: product.productId } });
        if (auctionRequest) {
          auctionProducts.push(product);
        } else {
          normalProducts.push(product); 
        }
      } else if (product.type === 'customizable') {
        customizableProducts.push(product);
      } else {
        normalProducts.push(product);
      }
    }

    const addReviewStats = async (products) => {
      return await Promise.all(
        products.map(async (product) => {
          const reviewStats = await Review.findOne({
            where: { productId: product.productId },
            attributes: [
              [Sequelize.fn('COUNT', Sequelize.col('reviewId')), 'totalReviews'],
              [Sequelize.fn('AVG', Sequelize.col('rating')), 'averageRating'],
            ],
            raw: true,
          });

          const productData = product.toJSON();
          return {
            ...productData,
            totalReviews: parseInt(reviewStats?.totalReviews) || 0,
            averageRating: reviewStats?.averageRating ? parseFloat(reviewStats.averageRating).toFixed(2) : null,
          };
        })
      );
    };

    const [productsWithStats, auctionWithStats, customizableWithStats] = await Promise.all([
      addReviewStats(normalProducts),
      addReviewStats(auctionProducts),
      addReviewStats(customizableProducts),
    ]);

    res.status(200).json({
      products: productsWithStats,
      auctionProducts: auctionWithStats,
      customizableProducts: customizableWithStats,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;
        const artist = await Artist.findOne({where:{userId}});
        const admin = await Admin.findOne({where:{userId}});
         const productId = req.params.productId;
        const product = await Product.findOne({where:{productId}});

        if(role== 'admin') {
          if(product.type !== 'normal') {
            return res.status(400).json({
                message: `Cannot delete ${product.type} products. Only normal products can be deleted.`
            });

          }
                  if (product.image?.length > 0) {
            const userIdForCloudinary = artist ? artist.userId : userId;
            const deleteResult = await deleteImagesByPublicIds(userIdForCloudinary, product.image);
            if (!deleteResult.success) {
                console.error('Failed to delete images from Cloudinary:', deleteResult.error);
            }
        }

        await product.destroy();
        res.status(200).json({message: 'Product deleted successfully'});

        }

        if(!artist && !admin) {
            return res.status(403).json({message: 'You are not authorized to delete a product'});
        }
        
       
        if(!product) {
            return res.status(404).json({message: 'Product not found'});
        }
        if(artist && !admin && product.artistId !== artist.artistId) {
            return res.status(403).json({message: 'Forbidden: You can only delete your own products'});
        }

        if(product.type !== 'normal') {
            return res.status(400).json({
                message: `Cannot delete ${product.type} products. Only normal products can be deleted.`
            });
        }

        if (product.image?.length > 0) {
            const userIdForCloudinary = artist ? artist.userId : userId;
            const deleteResult = await deleteImagesByPublicIds(userIdForCloudinary, product.image);
            if (!deleteResult.success) {
                console.error('Failed to delete images from Cloudinary:', deleteResult.error);
            }
        }

        await product.destroy();
        res.status(200).json({message: 'Product deleted successfully'});
    } catch (error) {
        res.status(500).json({message: error.message});
    }
}