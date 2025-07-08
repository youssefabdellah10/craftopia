const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Artist = require('./artist');
const Order = require('./order');
const Payment = require('./payment');

const Sales = sequelize.define('sales_history', {
    salesId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    artistId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Artist,
            key: 'artistId'
        }
    },
    paymentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Payment,
            key: 'paymentId'
        }
    },
    salesAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    currency: {
        type: DataTypes.STRING(3),
        allowNull: false,
        defaultValue: 'LE'
    },
    saleDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    timestamps: true
});

module.exports = Sales;
