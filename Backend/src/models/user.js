const {DataTypes} = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('user', {
    userId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        indexes: [
            {
                unique: true,
                fields: ['email']
            }
        ]
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM,
        values: ['admin', 'customer','artist'],
        allowNull: false,
        indexes: [
            {
                fields: ['role']
            }
        ]
    },
    isEmailVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    isBanned: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
}, {
    timestamps: true,
    indexes: [
        {
            fields: ['email']
        },
        {
            fields: ['role']
        }
    ]
});

module.exports = User;