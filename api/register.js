const bcrypt = require('bcryptjs');

// Mock User Database for Demo (Would use MongoDB/Postgres in prod)
// Note: In Serverless functions, in-memory state is stateless between warm boots.
// However, since this is just a mockup demonstration for Vercel, it works perfectly for a single session test.
let users = [];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { email, password, role } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Hash the password securely
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Save to our mock DB
    const newUser = {
      id: Date.now(),
      email,
      password: hashedPassword,
      role: role || 'admin'
    };
    
    users.push(newUser);

    // In a real database, we would save the user here
    return res.status(200).json({ message: 'User registered successfully', success: true });
    
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
