import env from './environment.js';

export const corsOptions = {
  origin(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.) in dev
    if (!origin && env.isDevelopment()) {
      return callback(null, true);
    }
    if (env.CORS_ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error(`CORS: Origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  exposedHeaders: ['X-Total-Count', 'X-Request-ID'],
  maxAge: 86400, // 24 hours
};

export default corsOptions;
