import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import courseRoutes from './routes/courses.js';
import assignmentRoutes from './routes/assignments.js';
import attendanceRoutes from './routes/attendance.js';
import uploadRoutes from './routes/upload.js';
import chatRoutes from './routes/chat.js';
import announcementRoutes from './routes/announcements.js';

// Import socket handlers
import { authenticateSocket, handleSocketConnection } from './socket/socketHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Fallback environment variables
if (!process.env.MONGODB_URI) {
  console.warn('⚠️  MONGODB_URI not found in environment variables. Please configure MongoDB Atlas connection.');
  process.env.MONGODB_URI = 'mongodb://localhost:27017/academixone'; // Fallback to local for development
}
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = '94e114560d59fd9ac38ac5c9b45d77f61b4637d58b9afc34e2b91bc7020eee91';
}

// Debug environment variables
console.log('🔍 Environment check:');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Found' : 'Missing');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Found' : 'Missing');
if (process.env.MONGODB_URI) {
  console.log('📍 MongoDB URI preview:', process.env.MONGODB_URI.substring(0, 30) + '...');
}

const app = express();
const server = createServer(app);
let PORT = process.env.PORT || 3001;

// Initialize Socket.io with simplified configuration
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  },
  allowEIO3: true,
  transports: ['websocket', 'polling']
});

// Socket authentication middleware
io.use(authenticateSocket);

// Handle socket connections
handleSocketConnection(io);

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000'
  ],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/announcements', announcementRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'AcademixOne API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error occurred:', err.stack);
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      message: 'Validation Error',
      error: err.message
    });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({ 
      message: 'Invalid ID format',
      error: 'The provided ID is not valid'
    });
  }
  
  if (err.code === 11000) {
    return res.status(400).json({ 
      message: 'Duplicate entry',
      error: 'A record with this information already exists'
    });
  }
  
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// MongoDB connection with retry logic
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/academixone';

// MongoDB Atlas connection options
const mongooseOptions = {
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  maxPoolSize: 10, // Maintain up to 10 socket connections
};

const connectWithRetry = () => {
  console.log('🔄 Attempting to connect to MongoDB...');
  console.log('📍 Connection URI:', MONGODB_URI.replace(/\/\/.*@/, '//***:***@')); // Hide credentials in logs
  
  mongoose.connect(MONGODB_URI, mongooseOptions)
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas');
    console.log('🏛️  Database:', mongoose.connection.db.databaseName);
    
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 API URL: http://localhost:${PORT}/api`);
      console.log(`💬 Socket.io enabled for real-time chat`);
    });
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error.message);
    if (error.message.includes('authentication failed')) {
      console.error('🔐 Check your MongoDB Atlas username and password');
    } else if (error.message.includes('network')) {
      console.error('🌐 Check your network connection and MongoDB Atlas network access settings');
    }
    console.log('🔄 Retrying connection in 5 seconds...');
    setTimeout(connectWithRetry, 5000);
  });
};

// Handle MongoDB connection events
mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected');
});

connectWithRetry();

// Graceful shutdown and error handling
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down gracefully...');
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
    process.exit(1);
  }
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  console.log('🔄 Server will continue running...');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't continue running on unhandled rejections - exit gracefully
  process.exit(1);
});

export default app;