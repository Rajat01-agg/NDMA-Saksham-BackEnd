const mongoose = require('mongoose');
require('dotenv').config();

async function createSampleData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL);
    console.log('✅ MongoDB Connected for sample data');

    // Clear existing test data
    await mongoose.connection.db.collection('districts').deleteMany({ name: 'pune' });
    await mongoose.connection.db.collection('users').deleteMany({ clerkId: 'user_trainer_pune' });

    // 1. Create District
    const district = {
      _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
      name: 'pune',
      state: 'maharashtra',
      census_code: 'MH-PUN',
      location: {
        type: 'Point',
        coordinates: [73.8567, 18.5204]
      },
      risk_level: 'MODERATE',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await mongoose.connection.db.collection('districts').insertOne(district);
    console.log('✅ District created:', district.name);

    // 2. Create Trainer User
    const trainer = {
      _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439012'),
      clerkId: 'user_trainer_pune',
      email: 'trainer.pune@test.com',
      firstName: 'Pune',
      lastName: 'Trainer',
      role: 'trainer',
      district: 'pune',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await mongoose.connection.db.collection('users').insertOne(trainer);
    console.log('✅ Trainer user created:', trainer.clerkId);

    console.log('\n🎯 SAMPLE DATA CREATED SUCCESSFULLY!');
    console.log('District ID: 507f1f77bcf86cd799439011');
    console.log('Trainer ID: 507f1f77bcf86cd799439012');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating sample data:', error);
    process.exit(1);
  }
}

createSampleData();