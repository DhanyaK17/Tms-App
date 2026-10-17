require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');

// Import routes
const authRoutes = require('./routes/authRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const programmeRoutes = require('./routes/programmeRoutes');
const blockRoutes = require('./routes/blockRoutes');
const roomRoutes = require('./routes/roomRoutes');
const roleRoutes = require('./routes/roleRoutes');
const userRoutes = require('./routes/userRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const path = require('path');

const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with CORS support
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Attach io to req object so controllers can emit real-time events
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Connect to MongoDB
connectDB();

// Real-time socket rooms and events
io.on('connection', (socket) => {
  // Join room for a specific complaint to track live status updates
  socket.on('join_complaint', (complaintId) => {
    if (complaintId) {
      socket.join(`complaint_${complaintId}`);
    }
  });

  socket.on('leave_complaint', (complaintId) => {
    if (complaintId) {
      socket.leave(`complaint_${complaintId}`);
    }
  });

  // Join room for user's own updates
  socket.on('join_user', (userId) => {
    if (userId) {
      socket.join(`user_${userId}`);
    }
  });

  socket.on('disconnect', () => {
    // Clean up if needed
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/programmes', programmeRoutes);
app.use('/api/blocks', blockRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/users', userRoutes);
// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Complaints
app.use('/api/complaints', complaintRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running', realtime: true });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

