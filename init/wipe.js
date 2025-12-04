const mongoose = require("mongoose");
const { District, User, TrainingSession, TrainingCenter } = require("../models");

const MONGO_URL = "mongodb://127.0.0.1:27017/saksham";

async function wipeDB() {
    try {
        await mongoose.connect(MONGO_URL);
        console.log("Connected!");

        await District.deleteMany({});
        await User.deleteMany({});
        await TrainingSession.deleteMany({});
        await TrainingCenter.deleteMany({});

        console.log("All collections cleared successfully!");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

wipeDB();
//Can wipe whole database using this script