require('node:dns').setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`[SKR-Global API] Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
});
