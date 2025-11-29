const axios = require('axios');

const testRegister = async () => {
  try {
    console.log('Testing register endpoint...');
    const response = await axios.post('http://localhost:5000/api/auth/register', {
      firstName: 'Test',
      lastName: 'User',
      email: 'test123@example.com',
      password: 'password123',
    });
    console.log('Success:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
    console.error('Full Error:', error);
  }
  process.exit(0);
};

testRegister();
