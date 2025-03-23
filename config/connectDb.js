const mongoose = require('mongoose');

const connectDb = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URL, { dbName: 'iot-all' });
    console.log('Database Connected...');
  } catch (error) {
    console.error('DB Connection Error:', error);
    process.exit(1);
  }
};

module.exports = connectDb;
