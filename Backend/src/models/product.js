const {DataTypes} = require('sequelize');
const sequelize = require('../config/db');
const Artist = require('./artist');
const category = require('./category');


const Product = sequelize.define('product', {
    productId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    price: {
        type: DataTypes.DECIMAL,
        allowNull: false
    },
    description: {
        type: DataTypes.STRING,
        allowNull: false
    },
    image: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    artistId: {
        type: DataTypes.INTEGER,
        references:{
            model: Artist,
            key: 'artistId'
        }
    },
    categoryId: {
        type: DataTypes.INTEGER,
        references:{
            model: category,
            key: 'categoryId'
        },
        allowNull: true
    },
    dimensions: {
        type: DataTypes.STRING,
        allowNull: true
    },
    material: {
        type: DataTypes.STRING,
        allowNull: true
    },
    sellingNumber:{
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('auction', 'normal', 'customizable'),
        allowNull: false,
        defaultValue: 'normal'
    },

});


module.exports = Product;