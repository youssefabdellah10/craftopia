const {DataTypes} = require('sequelize');
const sequelize = require('../config/db');
const User = require('./user');

const Customer = sequelize.define('customer', {
    customerId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId : {
        type: DataTypes.INTEGER,
        references:{
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
    address: {
        type: DataTypes.STRING,
        allowNull: false
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    }
});



module.exports = Customer;