require("dotenv").config();
const mongoose = require("mongoose");
const path = require("path");

// Import models (change path if needed)
const { District, User, TrainingSession, TrainingCenter } = require("../models");

const MONGO_URL = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/saksham";

async function clearDB() {
  console.log("Clearing all collections...");
  await District.deleteMany({});
  await User.deleteMany({});
  await TrainingSession.deleteMany({});
}

async function insertTestData() {
  console.log("Inserting test data...");

  const district = await District.create({
    name: "Test District",
    state: "Test State",
    code: "TD-01",
    location: {
        type: "Point",
        coordinates: [77.2090, 28.6139]
      }
  });

  const trainer = await User.create({
    name: "Test Trainer",
    email: "trainer@test.com",
    mobile_number: "9999999979",
    role: "MASTER_TRAINER",
    password: "password123", // plain password for seed only
  });

  const participant = await User.create({
    name: "Test Participant",
    email: "participant@test.com",
    mobile_number: "9999999999",
    role: "VOLUNTEER",
    password: "password123",
  });

  await TrainingSession.create({
    title: "Sample Training Session", 
    topic: "Sample Training Session", 
    trainer_id: trainer._id, 
    district_id: district._id, 
    // training_center_id: center._id, 
    event_date: new Date(), 
    geo_data: {
        target_location: {
          type: "Point",
          coordinates: [77.2090, 28.6139] // Same coordinates as training center
        },
        submitted_location: {
          type: "Point", 
          coordinates: [77.2090, 28.6139] // Same coordinates as training center
        }
      },
    attendance_validation: {
      claimed_count: 1 // Required field - number of attendees
    },
    status: "PENDING"
  });

  console.log("Seeding completed successfully!");
}

async function main() {
  console.log("Connecting to DB...");

  await mongoose.connect(MONGO_URL);
  console.log("Connected!");

  await clearDB();
  await insertTestData();

  await mongoose.disconnect();
  console.log("Disconnected. Done.");
}

main();
