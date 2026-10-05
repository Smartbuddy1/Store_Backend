const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const prisma = require('../config/supabase');

const login = async (req, res) => {
  const { mobile, password } = req.body;

  if (!mobile || !password) {
    return res.status(400).json({ success: false, message: 'Mobile number and password are required' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { mobile } });

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid mobile number or user is inactive' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid mobile number or password' });
    }

    const payload = {
      id: user.id,
      mobile: user.mobile,
      name: user.name,
      role: user.role,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    });

    res.json({
      success: true,
      token,
      user: payload,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const verifyToken = (req, res) => {
  // If this route is hit, middleware already verified the token
  res.json({ success: true, user: req.user });
};

module.exports = { login, verifyToken };
