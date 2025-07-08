const {DataTypes} = require('sequelize');
const sequelize = require('../config/db');
const Customer = require('./customer');
const Artist = require('./artist');

const Rating = sequelize.define('rating', {
    ratingId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    customerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Customer,
            key: 'customerId'
        }
    },
    artistId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Artist,
            key: 'artistId'
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
    comment: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, 
{
    indexes: [
        {
            unique: true,
            fields: ['customerId', 'artistId']
        }
    ]
});

module.exports = Rating;
