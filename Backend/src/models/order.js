const {DataTypes} = require('sequelize');
const sequelize = require('../config/db');
const Customer = require('./customer');
const Order = sequelize.define('order', {
    orderId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },    
    totalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('Pending', 'Completed', 'Cancelled','Shipped'),
        defaultValue: 'Pending'
    },
    customerId: {
        type: DataTypes.INTEGER,
        references:{
            model: Customer,
            key: 'customerId'
        }
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updatedAt: {
        type: DataTypes.DATE,
        allowNull : true
    },
    shippedAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
});

module.exports = Order;