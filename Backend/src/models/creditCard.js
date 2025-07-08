const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const CreditCard = sequelize.define('creditCard', {
    number: {
        type: DataTypes.STRING(16),
        primaryKey: true,
        allowNull: false,
        validate: {
            len: [13, 19], 
            isNumeric: true
        }
    },
    expiryDate: {
        type: DataTypes.STRING(5), 
        allowNull: false,
        validate: {
            len: [5, 5],
            is: /^(0[1-9]|1[0-2])\/\d{2}$/ 
        }
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
        validate: {
            min: 0
        }
    }
}, {
    tableName: 'creditCards',
    timestamps: true
});

module.exports = CreditCard;
