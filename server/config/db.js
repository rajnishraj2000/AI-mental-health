const dns = require('dns');
const mongoose = require('mongoose');

// Resolve Atlas SRV records reliably across all ISPs/Windows DNS resolvers
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Fall back to system default if setting servers is restricted
}

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.warn('\n⚠️  [MongoDB] MONGODB_URI is not defined in .env!');
      console.warn('👉 Please set MONGODB_URI in your .env file (e.g. MongoDB Atlas free cluster).\n');
      return;
    }
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`\n✅ MongoDB Connected successfully: ${conn.connection.host}\n`);
  } catch (error) {
    console.error(`\n❌ [MongoDB Connection Error]: ${error.message}`);
    console.error('👉 If you don\'t have local MongoDB installed, create a free cluster on MongoDB Atlas');
    console.error('   and paste your mongodb+srv://... URI into .env\n');
  }
};

module.exports = connectDB;
