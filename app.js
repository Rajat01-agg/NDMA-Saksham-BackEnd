require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require('cors');
const app = express();
const port = 3001;
const { District, User, TrainingSession } = require("./models");
const trainingRoutes = require('./routes/trainings');
const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
const reportRoutes = require('./routes/report');
const { errorHandler, notFoundHandler } = require('./util/ExpressError');

// MongoDB connection
const connectDB = async () => {
  try {
    const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/saksham';
    await mongoose.connect(mongoUrl);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};

// Connect to MongoDB before starting server
connectDB();

// Body parser
app.use(express.json());

// CORS middleware - allow frontend on 5173/5174 to call backend
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.get("/", (req, res) => {
  res.send("Hi, Saksham Backend is running");
});

app.use('/api/trainings', trainingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

app.use(notFoundHandler);

//Error Handling Middleware
app.use(errorHandler);