const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

const authRoutes = require('./routes/auth.routes');
const shipmentRoutes = require('./routes/shipment.routes');
const customsRoutes = require('./routes/customs.routes');
const errorHandler = require('./middleware/error.middleware');

const app = express();

// 1. Security HTTP Headers (OWASP A05)
app.use(helmet());

// 2. Strict CORS Policy
const allowedOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
app.use(
  cors({
    origin: allowedOrigin === '*' ? '*' : allowedOrigin.split(',').map((o) => o.trim()),
    credentials: true
  })
);

// 3. Rate Limiting (OWASP A07)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests from this IP. Please try again later.' }
});
app.use('/api', apiLimiter);

// 4. Body Parsing & NoSQL Injection Prevention (OWASP A03)
app.use(express.json({ limit: '10kb' }));
app.use(mongoSanitize());

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'SKR-Global Marine Logistics REST API',
    timestamp: new Date().toISOString()
  });
});

// Versioned REST Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/shipments', shipmentRoutes);
app.use('/api/v1/customs', customsRoutes);

// 404 Fallback
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Endpoint ${req.originalUrl} not found.` });
});

// Centralised Error Handler
app.use(errorHandler);

module.exports = app;
