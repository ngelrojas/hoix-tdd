const Sequelize = require('sequelize');

const sequelize = new Sequelize('hoixdb', 'postgres', 'admin', {
  dialect: 'postgres',
  host: 'localhost',
  port: 5432,
  logging: false,
});

module.exports = sequelize;
