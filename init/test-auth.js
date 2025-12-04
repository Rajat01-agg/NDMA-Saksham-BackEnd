require('dotenv').config();
const express = require('express');
const { 
  requireAuth, 
  requireAnyRole, 
  requireStateAccess, 
  requireTrainerAccess,
  requireVolunteerAccess,
  applyGeographicalFilter
} = require('../middlewares/auth');

const app = express();
app.use(express.json());

// ========================
// LOGIN ENDPOINT - GET REAL TOKENS
// ========================
// test-auth.js - UPDATED LOGIN ENDPOINT
// test-auth.js - UPDATED LOGIN ENDPOINT (SIMPLIFIED)
app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
  
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
      }
  
      // SIMPLE MOCK LOGIN - For testing only!
      const mockUsers = {
        'ndma.admin@test.com': {
          password: 'Test123!',
          user: {
            id: 'user_ndma_admin',
            emailAddresses: [{ emailAddress: 'ndma.admin@test.com' }],
            firstName: 'NDMA',
            lastName: 'Admin',
            publicMetadata: { role: 'ndma_admin' }
          }
        },
        'maharashtra.admin@test.com': {
          password: 'Test123!', 
          user: {
            id: 'user_sdma_maharashtra',
            emailAddresses: [{ emailAddress: 'maharashtra.admin@test.com' }],
            firstName: 'Maharashtra',
            lastName: 'Admin',
            publicMetadata: { role: 'sdma_admin', state: 'maharashtra' }
          }
        },
        'trainer.pune@test.com': {
          password: 'Test123!',
          user: {
            id: 'user_trainer_pune', 
            emailAddresses: [{ emailAddress: 'trainer.pune@test.com' }],
            firstName: 'Pune',
            lastName: 'Trainer',
            publicMetadata: { role: 'trainer', district: 'pune' }
          }
        },
        'volunteer.test@test.com': {
          password: 'Test123!',
          user: {
            id: 'user_volunteer_test',
            emailAddresses: [{ emailAddress: 'volunteer.test@test.com' }],
            firstName: 'Test',
            lastName: 'Volunteer', 
            publicMetadata: { role: 'volunteer' }
          }
        }
      };
  
      const userData = mockUsers[email];
      
      if (!userData || userData.password !== password) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
  
      // Create mock token (just user ID for now)
      const mockToken = userData.user.id;
  
      res.json({
        success: true,
        token: mockToken,
        user: userData.user
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });

// ========================
// TEST ROUTES (Same as before)
// ========================

// 1. Public route (no auth)
app.get('/', (req, res) => {
  res.json({ message: '🚀 Server is running! Basic test PASSED!' });
});

// 2. Basic protected route
app.get('/api/protected', requireAuth, (req, res) => {
  res.json({ 
    message: '✅ Basic authentication WORKS!',
    user: {
      id: req.user.id,
      email: req.user.emailAddresses[0]?.emailAddress,
      role: req.user.publicMetadata?.role,
      state: req.user.publicMetadata?.state
    }
  });
});

// 3. NDMA Admin only route
app.get('/api/admin/dashboard', 
  requireAuth, 
  requireAnyRole(['ndma_admin']),
  (req, res) => {
    res.json({ 
      message: '✅ NDMA Admin access WORKS!',
      user: req.user.publicMetadata 
    });
  }
);

// 4. SDMA State route
app.get('/api/state/:state/dashboard', 
  requireAuth, 
  requireAnyRole(['ndma_admin', 'sdma_admin']),
  requireStateAccess,
  (req, res) => {
    res.json({ 
      message: `✅ ${req.user.publicMetadata?.role.toUpperCase()} access WORKS for ${req.params.state}!`,
      user: req.user.publicMetadata
    });
  }
);

// 5. Trainer route
app.get('/api/trainer/my-trainings', 
  requireAuth, 
  requireAnyRole(['trainer']),
  requireTrainerAccess,
  (req, res) => {
    res.json({ 
      message: '✅ Trainer access WORKS!',
      trainer_id: req.trainer_id,
      user: req.user.publicMetadata
    });
  }
);

// 6. Volunteer route
app.get('/api/volunteer/dashboard', 
  requireAuth, 
  requireAnyRole(['volunteer']),
  requireVolunteerAccess,
  (req, res) => {
    res.json({ 
      message: '✅ Volunteer access WORKS!',
      user: req.user.publicMetadata
    });
  }
);

// 7. Test geographical filter
app.get('/api/test-geo', 
  requireAuth, 
  applyGeographicalFilter,
  (req, res) => {
    res.json({ 
      message: '✅ Geographical filter test!',
      geoFilter: req.geoFilter,
      user: req.user.publicMetadata
    });
  }
);

app.listen(3001, () => {
  console.log('🧪 Auth Test Server running on http://localhost:3001');
  console.log('');
  console.log('📋 NEW TESTING INSTRUCTIONS:');
  console.log('1. First login to get real token');
  console.log('2. Then use that token in other requests');
  console.log('');
  console.log('🔑 Login with:');
  console.log('   - ndma.admin@test.com / Test123!');
  console.log('   - maharashtra.admin@test.com / Test123!');
  console.log('   - trainer.pune@test.com / Test123!');
  console.log('   - volunteer.test@test.com / Test123!');
});