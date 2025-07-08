const {DataTypes} = require('sequelize');
const sequelize = require('../config/db');
const product = require('./product');
const customer = require('./customer');

const Review = sequelize.define('review', {
    reviewId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    customerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: customer,
            key: 'customerId'
        }
    },
    productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: product,
            key: 'productId'
        }
    },
    rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1,
            max: 5
        }
    },
    review: {
        type: DataTypes.TEXT,
        allowNull: false
    }
}, {
    indexes: [
        {
            unique: true,
            fields: ['customerId', 'productId']
        }
    ],
    timestamps: true
});

module.exports = Review;