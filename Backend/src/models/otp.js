const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./user');

const OTP = sequelize.define('otp', {
    otpId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        references: {
            model: User,
            key: 'userId'
        },
        allowNull: false
    },
    otpCode: {
        type: DataTypes.STRING(6),
        allowNull: false
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: false
    },
    isUsed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    attempts: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    timestamps: true,
    indexes: [
        {
            fields: ['userId']
        },
        {
            fields: ['otpCode']
        }
    ]
});

module.exports = OTP;
