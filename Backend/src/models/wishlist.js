const {DataTypes} = require('sequelize');
const sequelize = require('../config/db');
const Product = require('./product');
const Customer = require('./customer');

const Wishlist = sequelize.define('wishlist', {
    customerId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
            model: Customer,
            key: 'customerId'
        }
    },
    productId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
            model: Product,
            key: 'productId'
        }
    }
});

module.exports = Wishlist;