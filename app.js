require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const app = express();
const port = 3001;
const { District, User, TrainingSession } = require("./models");
const trainingRoutes = require('./routes/trainings');
const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
const testRoutes = require('./routes/testAuth');
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

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

app.get("/", (req, res) => {
  res.send("Hi, Saksham Backend is running");
});

app.use('/api/trainings', trainingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/test', testRoutes);

app.use(notFoundHandler);

//Error Handling Middleware
app.use(errorHandler);