const {DataTypes} = require('sequelize');
const sequelize = require('../config/db');
const artist = require('./artist');
const customizationRequest = require('./customizationRequest');

const customizationResponse = sequelize.define('customizationresponse', {
    responseId: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
    },
    requestId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
        model: customizationRequest,
        key: 'requestId'
        }
    },
    artistId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
        model: artist,
        key: 'artistId'
        }
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    estimationCompletionTime: {
        type: DataTypes.DATE,
        allowNull: false
    },
    notes: {
        type: DataTypes.STRING,
        allowNull: true
    },
    image: {
        type: DataTypes.STRING,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('PENDING', 'ACCEPTED', 'DECLINED'),
        allowNull: false,
        defaultValue: 'PENDING'
    },
});

module.exports = customizationResponse;