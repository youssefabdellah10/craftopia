const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Order = require('./order');
const Product = require('./product');

const Product_Order = sequelize.define('productorder', {
    orderId: {
        type: DataTypes.INTEGER,
        references: {
            model: Order,
            key: 'orderId'
        }
    },
    productId: {
        type: DataTypes.INTEGER,
        references: {
            model: Product,
            key: 'productId'
        }
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
});



module.exports = Product_Order;