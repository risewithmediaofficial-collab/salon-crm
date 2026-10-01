import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import hpp from 'hpp';
import mongoSanitize from 'express-mongo-sanitize';

import env from './config/environment.js';
import corsOptions from './config/cors.js';
import { requestId } from './middleware/requestId.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import sanitizeInputs from './security/sanitizer.js';
import routes from './routes/index.js';

const app = express();

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        scriptSrc: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// Cross-origin resource sharing
app.use(cors(corsOptions));

// Compression for responses
app.use(compression());

// Request tracking ID
app.use(requestId);

// HTTP logging
if (env.isDevelopment()) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', { skip: (_req, res) => res.statusCode < 400 }));
}

// Body parsing with safe size limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Input sanitization against NoSQL injection & HTTP Parameter Pollution
app.use(mongoSanitize());
app.use(hpp());
app.use(sanitizeInputs);

// Health check endpoint (exempt from rate limits)
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'salon-crm-api',
  });
});

// Apply rate limiting to all /api routes
app.use('/api', apiLimiter);

// Main API routes
app.use('/api', routes);

// 404 handler
app.use(notFoundHandler);

// Global centralized error handler
app.use(errorHandler);

export default app;
