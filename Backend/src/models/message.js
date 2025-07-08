const {DataTypes} = require('sequelize');
const sequelize = require('../config/db');
const User = require('./user');
const customizationResponse = require('./customizationResponse');

const Message = sequelize.define('message', {
    messageId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    responseId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references:{
            model: customizationResponse,
            key: 'responseId'
        }
    },
    senderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'userId'
        }
    },
    senderType: {
        type: DataTypes.ENUM('customer', 'artist'),
        allowNull: false,
    },
    receiverId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'userId'
        }
    },
    receiverType: {
        type: DataTypes.ENUM('customer', 'artist'),
        allowNull: false,
    },
    messageContent: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    attachmentUrl: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    readAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    deliveryStatus: {
        type: DataTypes.ENUM('sent', 'delivered', 'read'),
        defaultValue: 'sent',
        allowNull: false
    },
    isOfflineMessage: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
    }
}, {
    timestamps: true, 
    indexes: [
        {
            fields: ['responseId']
        },
        {
            fields: ['senderId', 'senderType']
        },
        {
            fields: ['receiverId', 'receiverType']
        },
        {
            fields: ['isRead']
        },
        {
            fields: ['createdAt']
        }
    ]
});

module.exports = Message;
