const axios = require('axios');

async function testLogin() {
  try {
    const response = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'test@test.com',
      password: '123456'  // Correct password from database
    });
    console.log('Login response:', response.data);
  } catch (error) {
    console.log('Login error:', error.response?.data || error.message);
  }
}

testLogin();
