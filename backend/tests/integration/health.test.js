import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app.js';

describe('Health and System Endpoints', () => {
  it('GET /health returns 200 OK with service status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('service', 'salon-crm-api');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('GET /non-existent-route returns 404 NOT_FOUND error response', async () => {
    const res = await request(app).get('/random-path-that-does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      success: false,
      message: 'Cannot GET /random-path-that-does-not-exist',
      code: 'NOT_FOUND',
    });
  });
});
