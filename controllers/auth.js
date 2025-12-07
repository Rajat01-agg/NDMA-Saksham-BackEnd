const User = require('../models/User');
const District = require('../models/District');

module.exports.register = async (req, res) => {
  const {
    firstName, lastName, email, mobile_number, password, role = 'volunteer', state, district } = req.body;

  // 2. Validate required fields
  if (!firstName || !email || !mobile_number || !password) {
    return res.status(400).json({
      success: false,
      error: 'All fields required'
    });
  }

  // 4. Create new user
  const newUser = await User.create({
    firstName: firstName.trim(),
    lastName: lastName ? lastName.trim() : '',
    email: email,
    mobile_number: mobile_number.trim(),
    passwordHash: password, // Plain text for now
    role: role,
    state: state,
    district: district,
    isActive: true,
    onboarding_source: 'pwa'
  });

  console.log('✅ User created with ID:', newUser._id);

  let token = '';

  if (newUser.role === 'sdma_admin') {
    token = 'user_sdma_maharashtra'; //same for all sdma's for simplicity 
  }
  else if (newUser.role === 'trainer') {
    token = 'user_trainer_pune'; //same for all trainers for making it simple 
  }
  else if (newUser.role === 'ndma_admin') {
    token = 'user_ndma_admin';
  }
  else {
    token = 'user_volunteer_test';
  }

  return {
    success: true,
    message: 'User registered successfully',
    user: newUser,
    token: token
  };
};


module.exports.login = async (req, res) => {
  const { email, mobile_number, password } = req.body;
    
  // Build query dynamically - only include conditions that are provided
  const queryConditions = [];
  if (email) {
    queryConditions.push({ email: email.toLowerCase() });
  }
  if (mobile_number) {
    queryConditions.push({ mobile_number: mobile_number.trim() });
  }

  if (queryConditions.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Email or mobile number is required'
    });
  }

  const query = queryConditions.length === 1 ? queryConditions[0] : { $or: queryConditions };

  // Find user by email OR mobile - explicitly select passwordHash
  const user = await User.findOne(query).select('+passwordHash');

  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'User not found'
    });
  }

  // Check password
  if (!password || user.passwordHash !== password) {
    return res.status(401).json({
      success: false,
      error: 'Invalid password'
    });
  }

  // Generate token based on role
  let token = '';
  
  if (user.role === 'sdma_admin') {
    token = 'user_sdma_maharashtra';
  } else if (user.role === 'trainer') {
    token = 'user_trainer_pune';
  } else if (user.role === 'ndma_admin') {
    token = 'user_ndma_admin';
  } else {
    token = 'user_volunteer_test';
  }
  
  // Success response
  res.json({
    success: true,
    message: 'Login successful',
    user: {
      id: user._id,
      name: `${user.firstName} ${user.lastName}`.trim(),
      email: user.email,
      role: user.role,
      state: user.state,
      district: user.district
    },
    token: token
  });
};


module.exports.getCurrentUser = async(req, res) => {
  const clerkUser = req.user;
    
  // Build query dynamically - only include conditions that are provided
  const queryConditions = [];
  const userEmail = clerkUser.emailAddresses?.[0]?.emailAddress;
  const userMobile = clerkUser.publicMetadata?.mobileNumber;

  if (userEmail) {
    queryConditions.push({ email: userEmail.toLowerCase() });
  }
  if (userMobile) {
    queryConditions.push({ mobile_number: userMobile.trim() });
  }

  if (queryConditions.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'No email or mobile number found in user profile'
    });
  }

  const query = queryConditions.length === 1 ? queryConditions[0] : { $or: queryConditions };
  const mongoUser = await User.findOne(query).lean();
  
  // If user doesn't exist in MongoDB (edge case)
  if (!mongoUser) {
    return res.status(404).json({
      success: false,
      error: 'User profile not found'
    });
  }
  
  // Response
  res.json({
    success: true,
    user: {
      id: mongoUser._id,
      clerkId: clerkUser.id,
      name: `${mongoUser.firstName} ${mongoUser.lastName}`.trim(),
      email: mongoUser.email,
      mobile_number: mongoUser.mobile_number,
      role: mongoUser.role,
      state: mongoUser.state,
      district: mongoUser.district,
      skills: mongoUser.skills || [],
      isActive: mongoUser.isActive,
      createdAt: mongoUser.createdAt,
      updatedAt: mongoUser.updatedAt
    }
  });
};

module.exports.logout = async(req, res) => {
  console.log('🔓 Logout requested');
    
    // Since we're using mock tokens, logout is simple
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
}