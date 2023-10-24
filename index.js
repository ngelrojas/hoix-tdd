const app = require('./src/app');
const sequelize = require('./src/config/database');

sequelize.sync({ force: true });

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
