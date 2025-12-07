// scripts/seed.js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const District = require('../models/District');
const TrainingSession = require('../models/TrainingSession');

// Check if MONGO_URL is set
if (!process.env.MONGO_URL) {
    console.error('❌ MONGO_URL is not defined in .env file');
    process.exit(1);
}

console.log('🔗 Connecting to MongoDB Atlas...');

// Connect to Atlas with better options
mongoose.connect(process.env.MONGO_URL, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
})
    .then(async () => {
        console.log('✅ MongoDB Atlas Connected');
        console.log('📊 Database:', mongoose.connection.name);
        await seedDatabase();
    })
    .catch(err => {
        console.error('❌ MongoDB Connection Error:', err.message);
        process.exit(1);
    });

const seedDatabase = async () => {
    try {
        // 1. Clear existing data
        console.log('\n🗑️ Clearing existing data...');
        const deleteResults = await Promise.all([
            User.deleteMany({}),
            District.deleteMany({}),
            TrainingSession.deleteMany({})
        ]);
        console.log('✅ All collections cleared');

        // 2. Create Districts
        console.log('\n📍 Creating districts...');
        const districts = [
            {
                name: 'pune',
                state: 'maharashtra',
                census_code: 'MH-01',
                location: {
                    type: 'Point',
                    coordinates: [73.8567, 18.5204] // [longitude, latitude]
                },
                risk_level: 'moderate'
            },
            {
                name: 'mumbai city',
                state: 'maharashtra',
                census_code: 'MH-02',
                location: {
                    type: 'Point',
                    coordinates: [72.8777, 19.0760]
                },
                risk_level: 'high'
            },
            {
                name: 'nagpur',
                state: 'maharashtra',
                census_code: 'MH-03',
                location: {
                    type: 'Point',
                    coordinates: [79.0882, 21.1458]
                },
                risk_level: 'low'
            },
            {
                name: 'bangalore urban',
                state: 'karnataka',
                census_code: 'KA-01',
                location: {
                    type: 'Point',
                    coordinates: [77.5946, 12.9716]
                },
                risk_level: 'moderate'
            },
            {
                name: 'delhi',
                state: 'delhi',
                census_code: 'DL-01',
                location: {
                    type: 'Point',
                    coordinates: [77.2090, 28.6139]
                },
                risk_level: 'high'
            }
        ];

        const createdDistricts = await District.insertMany(districts);
        console.log(`✅ Created ${createdDistricts.length} districts`);

        // 3. Create Users
        console.log('\n👥 Creating users...');
        const users = [
            // Admins
            {
                firstName: 'Admin',
                lastName: 'NDMA',
                email: 'admin@ndma.gov.in',
                mobile_number: '9876543210',
                passwordHash: 'admin123',
                role: 'ndma_admin',
                state: 'maharashtra',
                district: 'pune',
                isActive: true,
                skills: ['leadership', 'crisis management'],
                onboarding_source: 'manual'
            },
            {
                firstName: 'State',
                lastName: 'Officer',
                email: 'state@maharashtra.gov.in',
                mobile_number: '9876543211',
                passwordHash: 'state123',
                role: 'sdma_admin',
                state: 'maharashtra',
                district: 'mumbai city',
                isActive: true,
                skills: ['logistics', 'coordination'],
                onboarding_source: 'manual'
            },
            {
                firstName: 'Delhi',
                lastName: 'Admin',
                email: 'state@delhi.gov.in',
                mobile_number: '9876543215',
                passwordHash: 'delhi123',
                role: 'sdma_admin',
                state: 'delhi',
                district: 'delhi',
                isActive: true,
                skills: ['administration'],
                onboarding_source: 'manual'
            },
            // Trainers
            {
                firstName: 'Trainer',
                lastName: 'Sharma',
                email: 'trainer.sharma@example.com',
                mobile_number: '9876543212',
                passwordHash: 'trainer123',
                role: 'trainer',
                state: 'maharashtra',
                district: 'pune',
                isActive: true,
                skills: ['first aid', 'evacuation procedures'],
                onboarding_source: 'pwa'
            },
            {
                firstName: 'Trainer',
                lastName: 'Patel',
                email: 'trainer.patel@example.com',
                mobile_number: '9876543216',
                passwordHash: 'trainer123',
                role: 'trainer',
                state: 'karnataka',
                district: 'bangalore urban',
                isActive: true,
                skills: ['fire safety', 'rescue operations'],
                onboarding_source: 'pwa'
            },
            // Volunteers
            {
                firstName: 'Volunteer',
                lastName: 'Kumar',
                email: 'volunteer.kumar@example.com',
                mobile_number: '9876543213',
                passwordHash: 'volunteer123',
                role: 'volunteer',
                state: 'karnataka',
                district: 'bangalore urban',
                isActive: true,
                skills: ['rescue operations', 'communication'],
                onboarding_source: 'whatsapp'
            },
            {
                firstName: 'Volunteer',
                lastName: 'Singh',
                email: 'volunteer.singh@example.com',
                mobile_number: '9876543217',
                passwordHash: 'volunteer123',
                role: 'volunteer',
                state: 'maharashtra',
                district: 'pune',
                isActive: true,
                skills: ['first aid', 'crowd management'],
                onboarding_source: 'pwa'
            },
            // Partner Organizations
            {
                firstName: 'Partner',
                lastName: 'Organization',
                email: 'ngo@example.com',
                mobile_number: '9876543214',
                passwordHash: 'partner123',
                role: 'partner_org',
                state: 'maharashtra',
                district: 'nagpur',
                isActive: true,
                skills: ['relief distribution', 'medical aid'],
                onboarding_source: 'manual'
            }
        ];

        const createdUsers = await User.insertMany(users);
        console.log(`✅ Created ${createdUsers.length} users`);

        // 4. Create Training Sessions
        console.log('\n🎓 Creating training sessions...');
        const puneDistrict = createdDistricts.find(d => d.name === 'pune');
        const mumbaiDistrict = createdDistricts.find(d => d.name === 'mumbai city');
        const bangaloreDistrict = createdDistricts.find(d => d.name === 'bangalore urban');
        const delhiDistrict = createdDistricts.find(d => d.name === 'delhi');
        
        const trainerSharma = createdUsers.find(u => u.email === 'trainer.sharma@example.com');
        const trainerPatel = createdUsers.find(u => u.email === 'trainer.patel@example.com');

        console.log('   Pune District ID:', puneDistrict?._id);
        console.log('   Mumbai District ID:', mumbaiDistrict?._id);
        console.log('   Bangalore District ID:', bangaloreDistrict?._id);
        console.log('   Delhi District ID:', delhiDistrict?._id);
        console.log('   Trainer Sharma ID:', trainerSharma?._id);
        console.log('   Trainer Patel ID:', trainerPatel?._id);

        if (!puneDistrict || !trainerSharma) {
            throw new Error('Missing required data for training sessions');
        }

        // IMPORTANT: Generate unique session codes
        const timestamp = Date.now();
        const trainings = [
            {
                session_code: `FLOOD-PUNE-${timestamp}-1`,
                trainer_id: trainerSharma._id,
                district_id: puneDistrict._id,
                theme: 'flood',
                start_date: new Date('2024-12-20T09:00:00Z'),
                end_date: new Date('2024-12-20T17:00:00Z'),
                scheduled_at: new Date(),
                ingestion_source: 'app',
                geo_data: {
                    actual_location: {
                        type: 'Point',
                        coordinates: [73.8567, 18.5204]
                    },
                    submitted_location: {
                        type: 'Point',
                        coordinates: [73.8567, 18.5204]
                    },
                    location_source: 'gps',
                    distance_deviation_meters: 0,
                    is_within_geofence: true
                },
                attendance_validation: {
                    claimed_count: 25,
                    ai_detected_count: 23,
                    confidence_score: 92,
                    is_flagged_discrepancy: false
                },
                venue_address: 'Pune Training Center, Shivajinagar',
                description: 'Flood rescue operations training',
                status: 'scheduled',
                verification_status: 'unverified'
            },
            {
                session_code: `EQ-PUNE-${timestamp}-2`,
                trainer_id: trainerSharma._id,
                district_id: puneDistrict._id,
                theme: 'earthquake',
                start_date: new Date('2024-12-25T10:00:00Z'),
                end_date: new Date('2024-12-25T16:00:00Z'),
                scheduled_at: new Date(),
                ingestion_source: 'whatsapp',
                geo_data: {
                    actual_location: {
                        type: 'Point',
                        coordinates: [73.8500, 18.5300]
                    },
                    submitted_location: {
                        type: 'Point',
                        coordinates: [73.8500, 18.5300]
                    },
                    location_source: 'gps',
                    distance_deviation_meters: 150,
                    is_within_geofence: true
                },
                attendance_validation: {
                    claimed_count: 30,
                    ai_detected_count: 28,
                    confidence_score: 85,
                    is_flagged_discrepancy: true
                },
                venue_address: 'Earthquake Safety Institute, Pune',
                description: 'Earthquake preparedness and first response',
                status: 'completed',
                verification_status: 'verified',
                verification_score: 85,
                verification_logs: [
                    {
                        check_type: 'geofence',
                        status: 'pass'
                    },
                    {
                        check_type: 'ai_headcount',
                        status: 'warning'
                    }
                ]
            },
            {
                session_code: `FIRE-MUMBAI-${timestamp}-3`,
                trainer_id: trainerSharma._id,
                district_id: mumbaiDistrict._id,
                theme: 'fire',
                start_date: new Date('2024-12-22T10:00:00Z'),
                end_date: new Date('2024-12-22T16:00:00Z'),
                scheduled_at: new Date(),
                ingestion_source: 'app',
                geo_data: {
                    actual_location: {
                        type: 'Point',
                        coordinates: [72.8777, 19.0760]
                    },
                    submitted_location: {
                        type: 'Point',
                        coordinates: [72.8777, 19.0760]
                    },
                    location_source: 'gps',
                    distance_deviation_meters: 0,
                    is_within_geofence: true
                },
                attendance_validation: {
                    claimed_count: 40,
                    ai_detected_count: 38,
                    confidence_score: 95,
                    is_flagged_discrepancy: false
                },
                venue_address: 'Mumbai Fire Safety Academy',
                description: 'Fire safety and evacuation training',
                status: 'in-progress',
                verification_status: 'unverified'
            },
            {
                session_code: `CYCLONE-BLR-${timestamp}-4`,
                trainer_id: trainerPatel._id,
                district_id: bangaloreDistrict._id,
                theme: 'cyclone',
                start_date: new Date('2024-12-28T09:00:00Z'),
                end_date: new Date('2024-12-28T17:00:00Z'),
                scheduled_at: new Date(),
                ingestion_source: 'app',
                geo_data: {
                    actual_location: {
                        type: 'Point',
                        coordinates: [77.5946, 12.9716]
                    },
                    submitted_location: {
                        type: 'Point',
                        coordinates: [77.5946, 12.9716]
                    },
                    location_source: 'gps',
                    distance_deviation_meters: 0,
                    is_within_geofence: true
                },
                attendance_validation: {
                    claimed_count: 20,
                    ai_detected_count: 20,
                    confidence_score: 100,
                    is_flagged_discrepancy: false
                },
                venue_address: 'Bangalore Disaster Management Center',
                description: 'Cyclone preparedness training',
                status: 'scheduled',
                verification_status: 'unverified'
            },
            {
                session_code: `GENERAL-DELHI-${timestamp}-5`,
                trainer_id: trainerPatel._id,
                district_id: delhiDistrict._id,
                theme: 'general',
                start_date: new Date('2025-01-05T10:00:00Z'),
                end_date: new Date('2025-01-05T16:00:00Z'),
                scheduled_at: new Date(),
                ingestion_source: 'whatsapp',
                geo_data: {
                    actual_location: {
                        type: 'Point',
                        coordinates: [77.2090, 28.6139]
                    },
                    submitted_location: {
                        type: 'Point',
                        coordinates: [77.2090, 28.6139]
                    },
                    location_source: 'gps',
                    distance_deviation_meters: 0,
                    is_within_geofence: true
                },
                attendance_validation: {
                    claimed_count: 35,
                    ai_detected_count: 33,
                    confidence_score: 88,
                    is_flagged_discrepancy: false
                },
                venue_address: 'Delhi Emergency Response Center',
                description: 'General disaster management training',
                status: 'scheduled',
                verification_status: 'unverified'
            }
        ];

        // Create training sessions one by one to catch errors
        const savedTrainings = [];
        for (let i = 0; i < trainings.length; i++) {
            try {
                console.log(`\n   Creating training ${i + 1}: ${trainings[i].session_code}`);
                
                // Create instance and validate
                const training = new TrainingSession(trainings[i]);
                
                // Validate manually
                const validationError = training.validateSync();
                if (validationError) {
                    console.error(`   ❌ Validation errors for ${trainings[i].session_code}:`);
                    Object.keys(validationError.errors).forEach(key => {
                        console.error(`      ${key}: ${validationError.errors[key].message}`);
                    });
                    continue; // Skip this one
                }
                
                // Save the training
                const savedTraining = await training.save();
                savedTrainings.push(savedTraining);
                console.log(`   ✅ Saved: ${savedTraining.session_code} (ID: ${savedTraining._id})`);
                
            } catch (error) {
                console.error(`   ❌ Error saving training ${i + 1}:`, error.message);
                if (error.code === 11000) {
                    console.error('   Duplicate session_code detected, trying with new code...');
                    // Try with a different code
                    trainings[i].session_code = `${trainings[i].session_code}-${Date.now()}`;
                    try {
                        const retryTraining = new TrainingSession(trainings[i]);
                        const retrySaved = await retryTraining.save();
                        savedTrainings.push(retrySaved);
                        console.log(`   ✅ Saved with new code: ${retrySaved.session_code}`);
                    } catch (retryError) {
                        console.error('   ❌ Failed on retry too:', retryError.message);
                    }
                }
            }
        }

        console.log(`\n✅ Created ${savedTrainings.length} training sessions`);

        // 5. Verify all data
        console.log('\n🔎 Verifying saved data...');
        const finalCounts = await Promise.all([
            User.countDocuments(),
            District.countDocuments(),
            TrainingSession.countDocuments()
        ]);

        console.log('📊 Final Database Counts:');
        console.log(`   Users: ${finalCounts[0]}`);
        console.log(`   Districts: ${finalCounts[1]}`);
        console.log(`   Training Sessions: ${finalCounts[2]}`);

        // List all training sessions
        const allTrainings = await TrainingSession.find({})
            .select('session_code theme status verification_status')
            .lean();
        
        console.log('\n📋 All Training Sessions:');
        allTrainings.forEach((t, i) => {
            console.log(`   ${i + 1}. ${t.session_code} - ${t.theme} (${t.status}, ${t.verification_status})`);
        });

        // Print summary
        console.log('\n🎯 SEEDING COMPLETE!');
        console.log('==========================================');
        console.log('📊 Summary:');
        console.log(`   - Districts: ${createdDistricts.length}`);
        console.log(`   - Users: ${createdUsers.length}`);
        console.log(`   - Training Sessions: ${savedTrainings.length}`);
        console.log('==========================================');
        console.log('\n🔐 Test Credentials:');
        console.log('==========================================');
        console.log('1. NDMA Admin: admin@ndma.gov.in / admin123');
        console.log('2. SDMA Admin (Maharashtra): state@maharashtra.gov.in / state123');
        console.log('3. SDMA Admin (Delhi): state@delhi.gov.in / delhi123');
        console.log('4. Trainer (Pune): trainer.sharma@example.com / trainer123');
        console.log('5. Trainer (Bangalore): trainer.patel@example.com / trainer123');
        console.log('6. Volunteer (Karnataka): volunteer.kumar@example.com / volunteer123');
        console.log('7. Volunteer (Maharashtra): volunteer.singh@example.com / volunteer123');
        console.log('8. Partner Org (Maharashtra): ngo@example.com / partner123');
        console.log('9. Partner Org (Delhi): ngo2@example.com / partner123');
        console.log('10. Inactive User: inactive@example.com / test123');
        console.log('==========================================');
        console.log('\n💡 IMPORTANT:');
        console.log('   - These users DON\'T have clerkId yet.');
        console.log('   - You need to register/login via API to get clerkId & JWT token.');
        console.log('   - Use these credentials for testing authentication routes.');
        console.log('==========================================');

    } catch (error) {
        console.error('\n❌ SEEDING FAILED:', error.message);
        console.error('Stack:', error.stack);
        
        // Try to get more specific error info
        if (error.name === 'ValidationError') {
            console.error('Validation Errors:');
            Object.keys(error.errors).forEach(key => {
                console.error(`  ${key}: ${error.errors[key].message}`);
            });
        }
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 MongoDB connection closed');
    }
};