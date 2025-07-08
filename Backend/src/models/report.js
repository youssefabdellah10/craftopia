const {DataTypes} = require('sequelize');
const sequelize = require('../config/db');
const customer = require('./customer');
const artist = require('./artist');

const Report = sequelize.define('report', {
    ReportId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    content: {
        type: DataTypes.STRING,
        allowNull: false
    },
    ReporterID: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    ReporterType: {
        type: DataTypes.ENUM('customer', 'artist'),
        allowNull: false
    },
    ReportedID: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    ReportedType: {
        type: DataTypes.ENUM('customer', 'artist'),
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM("submitted", "reviewed"),
        defaultValue: "submitted",
        allowNull: false
    },
    attachmentUrl: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    adminReviwerId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'userId'
        }
    },
    reviewedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    reporterusername: {
        type: DataTypes.STRING,
        allowNull: true
    },
    reportedusername: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    timestamps: true,
    indexes: [
        {
            fields: ['ReporterID', 'ReporterType']
        },
        {
            fields: ['ReportedID', 'ReportedType']
        },
        {
            fields: ['status']
        },
        {
            fields: ['createdAt']
        }
    ]
});

module.exports = Report;