const {DataTypes} = require('sequelize');
const sequelize = require('../config/db');
const customer = require('./customer');

const CustomizationRequest = sequelize.define('customizationrequest', {
    requestId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    customerId: {
        type: DataTypes.INTEGER,
        references: {
            model: customer,
            key: 'customerId'
        }
    },
    requestDescription: {
        type: DataTypes.STRING,
        allowNull: false
    },
    budget: {
        type: DataTypes.DECIMAL,
        allowNull: false
    },
    title : {
        type: DataTypes.STRING,
        allowNull: false
    },
    deadline: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null
    },
    image: {
        type: DataTypes.STRING,
        allowNull: true
    },    
    status: {
        type: DataTypes.ENUM('OPEN', 'CLOSED'),
        defaultValue: 'OPEN',
        allowNull: false    
    },
    orderId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'orders',
            key: 'orderId'
        }
    }
});

module.exports = CustomizationRequest;