const {DataTypes} = require('sequelize');
const sequelize = require('../config/db');
const customer = require('./customer');
const artist = require('./artist');

const ArtistFollow = sequelize.define('artistfollow', {
    artistId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
            model: artist,
            key: 'artistId'
        }
    },
    customerId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
            model: customer,
            key: 'customerId'
        }
    }
});

module.exports = ArtistFollow;
