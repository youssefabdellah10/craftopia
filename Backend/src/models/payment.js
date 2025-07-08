const {DataTypes} = require('sequelize');
const sequelize = require('../config/db');
const customer = require('./customer');
const order = require('./order');

const Payment = sequelize.define('payment', {
    paymentId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    orderId: {
        type: DataTypes.INTEGER,
        references: {
            model: order,
            key: 'orderId'
        }
    },    
    customerId: {
        type: DataTypes.INTEGER,
        references: {
            model: customer,
            key: 'customerId'
        }
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    paymentMethod: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'escrow'
    },
    paymentReference: {
        type: DataTypes.STRING(16),
        references: {
            model: 'creditCards',
            key: 'number'
        },
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('held_in_escrow', 'released', 'failed'),
        allowNull: false
    },
    transactionType: {
        type: DataTypes.ENUM('payment', 'refund'),
        defaultValue: 'payment',
        allowNull: false
    },
    currency: {
        type: DataTypes.STRING(3),
        defaultValue: 'LE',
        allowNull: false
    },
    releasedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    paymentDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
});

module.exports = Payment;