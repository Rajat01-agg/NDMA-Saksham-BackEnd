// seedUsers.js
const mongoose = require('mongoose');
const User = require('../models/User');

const testUsers = [
    // NDMA Admin (matches mock token)
    {
        firstName: 'NDMA',
        lastName: 'Admin',
        email: 'ndma.admin@test.com',  // ✅ Changed to match mock
        mobile_number: '+919999999901',
        role: 'ndma_admin',
        passwordHash: '123456',
        isActive: true
    },
    // SDMA Admin (Maharashtra) - matches mock token
    {
        firstName: 'Maharashtra',
        lastName: 'Admin',
        email: 'maharashtra.admin@test.com',  // ✅ Changed to match mock
        mobile_number: '+919999999902',
        role: 'sdma_admin',
        state: 'maharashtra',
        passwordHash: '123456',
        isActive: true
    },
    // Trainer (Pune) - matches mock token
    {
        firstName: 'Pune',
        lastName: 'Trainer',
        email: 'trainer.pune@test.com',  // ✅ Already correct
        mobile_number: '+919999999903',
        role: 'trainer',
        state: 'maharashtra',
        district: 'pune',
        skills: ['CPR', 'First Aid'],
        passwordHash: '123456',
        isActive: true
    },
    // Volunteer - matches mock token
    {
        firstName: 'Test',
        lastName: 'Volunteer',
        email: 'volunteer.test@test.com',  // ✅ Changed to match mock
        mobile_number: '+919999999904',
        role: 'volunteer',
        state: 'maharashtra',
        district: 'pune',
        skills: ['First Aid'],
        passwordHash: '123456',
        isActive: true
    }
];

async function seedDatabase() {
    try {
        await mongoose.connect('mongodb://localhost:27017/saksham');
        console.log('✅ Connected to MongoDB');

        // Clear existing users
        await User.deleteMany({});
        console.log('🧹 Cleared existing users');

        // Create test users
        const createdUsers = await User.create(testUsers);
        console.log(`✅ Created ${createdUsers.length} test users`);

        // Display created users
        console.log('\n📋 Created Users:');
        createdUsers.forEach(user => {
            console.log(`- ${user.firstName} ${user.lastName} (${user.role})`);
            console.log(`  Email: ${user.email}, Token: user_${user.role === 'sdma_admin' ? 'sdma_maharashtra' : user.role === 'trainer' ? 'trainer_pune' : user.role}`)
        });

        console.log('\n🎯 Test Tokens:');
        console.log('- NDMA Admin: user_ndma_admin');
        console.log('- SDMA Admin: user_sdma_maharashtra');
        console.log('- Trainer: user_trainer_pune');
        console.log('- Volunteer: user_volunteer_test');

        await mongoose.disconnect();
        console.log('\n✅ Seeding complete!');

    } catch (error) {
        console.error('❌ Seeding error:', error);
        process.exit(1);
    }
}

seedDatabase();