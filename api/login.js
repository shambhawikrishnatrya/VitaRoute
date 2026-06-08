const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Hardcoded default admin (so login works immediately without registering)
const DEFAULT_USER = {
  email: 'admin@vitaroute.com',
  // bcrypt hash for "password"
  password: '$2b$10$U4oNDSFzc/XPh6uwyCMTEO1gjw3gu9Xn4dtUIeel.ZdTZ8puqg1YC',
  role: 'admin'
};

const JWT_SECRET = process.env.JWT_SECRET || 'vitaroute-super-secret-key';

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Since this is a serverless function without a DB connected yet, we'll just check against our default admin
    // Or if the user just registered (in memory), but Vercel serverless functions don't share memory reliably.
    // So we rely on the hardcoded default admin for the demo.
    
    let userToAuth = null;
    if (email === DEFAULT_USER.email) {
      userToAuth = DEFAULT_USER;
    }

    if (!userToAuth) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, userToAuth.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT Token
    const token = jwt.sign(
      { id: Date.now(), email: userToAuth.email, role: userToAuth.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(200).json({ 
      success: true,
      token, 
      user: { email: userToAuth.email, role: userToAuth.role } 
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
