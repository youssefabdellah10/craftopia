const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./user');

const Artist = sequelize.define('artist', {
    artistId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        references: {
            model: User,
            key: 'userId'
        }
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: false
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    profilePicture: {
        type: DataTypes.STRING,
        allowNull: false
    },
    profileVideo: {
        type: DataTypes.STRING,
        allowNull: false
    },
    biography: {
        type: DataTypes.STRING(500),
        allowNull: false
    }
    ,
    visitors: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    averageRating: {
        type: DataTypes.DECIMAL(3, 2),
        defaultValue: 0.00,
        validate: {
            min: 0,
            max: 5
        }
    },
    totalRatings: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    sales: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    }
});

module.exports = Artist;