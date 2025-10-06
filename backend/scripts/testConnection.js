import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

console.log('🔍 Environment variables loaded:');
console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
if (process.env.MONGODB_URI) {
  console.log('MONGODB_URI preview:', process.env.MONGODB_URI.substring(0, 50) + '...');
}

const MONGODB_URI = process.env.MONGODB_URI;

async function testConnection() {
  console.log('🧪 Testing MongoDB Atlas Connection...\n');
  
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in environment variables');
    console.log('💡 Please check your .env file');
    process.exit(1);
  }
  
  // Hide credentials in logs
  const safeUri = MONGODB_URI.replace(/\/\/.*@/, '//***:***@');
  console.log('📍 Connecting to:', safeUri);
  
  try {
    const mongooseOptions = {
      serverSelectionTimeoutMS: 10000, // 10 seconds timeout
      socketTimeoutMS: 45000,
      ssl: true,
      tls: true,
      retryWrites: true,
    };
    
    console.log('⏳ Attempting connection...');
    await mongoose.connect(MONGODB_URI, mongooseOptions);
    
    console.log('✅ Successfully connected to MongoDB Atlas!');
    console.log('🏛️  Database:', mongoose.connection.db.databaseName);
    console.log('🌐 Host:', mongoose.connection.host);
    console.log('📊 Ready State:', mongoose.connection.readyState);
    
    // Test a simple operation
    console.log('\n🔍 Testing database operations...');
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📚 Available collections:', collections.map(c => c.name).join(', ') || 'None (database is empty)');
    
    console.log('\n🎉 Connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    
    if (error.message.includes('authentication failed')) {
      console.log('\n💡 Troubleshooting tips:');
      console.log('   • Check your username and password in the connection string');
      console.log('   • Ensure the database user exists in MongoDB Atlas');
      console.log('   • Verify the user has proper permissions');
    } else if (error.message.includes('network') || error.message.includes('timeout')) {
      console.log('\n💡 Troubleshooting tips:');
      console.log('   • Check your internet connection');
      console.log('   • Verify your IP address is whitelisted in MongoDB Atlas Network Access');
      console.log('   • Try allowing access from anywhere (0.0.0.0/0) for testing');
    } else {
      console.log('\n💡 Check the MongoDB Atlas setup guide for more help');
    }
    
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testConnection();