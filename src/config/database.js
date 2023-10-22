const Sequelize = require('sequelize');
const config = require('config');

const dbConfig = config.get('connection');

const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
  dialect: dbConfig.dialect,
  host: dbConfig.host,
  port: dbConfig.port,
  logging: dbConfig.logging,
});

module.exports = sequelize;
