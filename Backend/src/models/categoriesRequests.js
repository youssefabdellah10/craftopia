const {DataTypes} = require('sequelize');
const sequelize = require('../config/db');
const User = require('./artist');
const Artist = require('./artist');

const categoriesRequests = sequelize.define('categoryRequest', {
    requestId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    artistId: {
        type: DataTypes.INTEGER,
        references: {
            model: Artist,
            key: 'artistId'
        },
        allowNull: false
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    counter: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        allowNull: false
    }
}, {
    timestamps: true,
    tableName: 'categoryRequests'
});

module.exports = categoriesRequests;