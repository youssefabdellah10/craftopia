const sequelize = require('./config/db');
require('./models/index');
const seedCreditCards = require('./scripts/seedCreditCards');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
    

    const syncOptions = { alter: true };
      
    await sequelize.sync(syncOptions);
    console.log('All models were synchronized successfully.');
    
    
    await seedCreditCards();
    
    const app = require('./app');
    
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });
    
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
})();