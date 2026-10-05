require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    callback(null, true); // Allow all origins for local network testing
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Auth Route (public - no middleware)
app.use('/api/auth', require('./routes/authRoutes'));

// JWT Middleware — all routes below require valid token
const authMiddleware = require('./middleware/authMiddleware');
app.use('/api', authMiddleware);

// Protected Routes
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/staff', require('./routes/staffRoutes'));
app.use('/api/items', require('./routes/itemRoutes'));
app.use('/api/stock-in', require('./routes/stockInRoutes'));
app.use('/api/stock-out', require('./routes/stockOutRoutes'));
app.use('/api/current-stock', require('./routes/stockRoutes'));
app.use('/api/tools', require('./routes/toolRoutes'));
app.use('/api/kits', require('./routes/kitRoutes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Store Management API is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
  console.log(`📦 Store Management API is ready`);
});
