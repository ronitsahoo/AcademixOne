import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import courseRoutes from './routes/courses.js';
import assignmentRoutes from './routes/assignments.js';
import attendanceRoutes from './routes/attendance.js';
import uploadRoutes from './routes/upload.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Fallback environment variables
if (!process.env.MONGODB_URI) {
  process.env.MONGODB_URI = 'mongodb://localhost:27017/academixone';
}
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = '94e114560d59fd9ac38ac5c9b45d77f61b4637d58b9afc34e2b91bc7020eee91';
}

// Debug environment variables
console.log('🔍 Environment check:');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Found' : 'Missing');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Found' : 'Missing');

const app = express();
let PORT = process.env.PORT || 3001;

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

// Function to find available port
const findAvailablePort = (startPort) => {
  return new Promise((resolve) => {
    const server = app.listen(startPort, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    }).on('error', () => {
      resolve(findAvailablePort(startPort + 1));
    });
  });
};

// MongoDB connection with retry logic
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/academixone';

const connectWithRetry = () => {
  mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  })
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    
    // Find available port
    const availablePort = await findAvailablePort(PORT);
    if (availablePort !== PORT) {
      console.log(`⚠️  Port ${PORT} is busy, switching to port ${availablePort}`);
      PORT = availablePort;
    }
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 API URL: http://localhost:${PORT}/api`);
    });
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    console.log('🔄 Retrying connection in 5 seconds...');
    setTimeout(connectWithRetry, 5000);
  });
};

// Handle MongoDB connection events
mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected');
});

connectWithRetry();

// Graceful shutdown and error handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed.');
    process.exit(0);
  });
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  console.log('🔄 Server will continue running...');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  console.log('🔄 Server will continue running...');
});

export default app;