const {DataTypes} = require('sequelize');
const sequelize = require('../config/db');
const Product = require('./product');
const Customer = require('./customer');

const Cart = sequelize.define('cart', {
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
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    }
});
module.exports = Cart;