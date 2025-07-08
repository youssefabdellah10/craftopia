const {DataTypes} = require('sequelize');
const sequelize = require('../config/db');

const Category = sequelize.define('category', {
    categoryId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

module.exports = Category;