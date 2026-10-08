import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app.js';

describe('API Route Validation & Guard Integration Tests', () => {
  describe('Customer Auth Endpoints', () => {
    it('POST /api/auth/customer/send-otp rejects invalid Indian phone number', async () => {
      const res = await request(app)
        .post('/api/auth/customer/send-otp')
        .send({ phone: '12345' });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'phone' }),
        ])
      );
    });

    it('POST /api/auth/customer/verify-otp rejects invalid OTP length or format', async () => {
      const res = await request(app)
        .post('/api/auth/customer/verify-otp')
        .send({ phone: '9876543210', otp: 'abc' });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'otp' }),
        ])
      );
    });
  });

  describe('Staff Auth Endpoints', () => {
    it('POST /api/auth/staff/login rejects invalid email and short password', async () => {
      const res = await request(app)
        .post('/api/auth/staff/login')
        .send({ email: 'not-an-email', password: '123' });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('VALIDATION_ERROR');
      const fields = res.body.errors.map((e) => e.field);
      expect(fields).toContain('email');
      expect(fields).toContain('password');
    });

    it('POST /api/auth/refresh-token rejects missing refreshToken', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({});

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'refreshToken' }),
        ])
      );
    });

    it('GET /api/auth/me requires Bearer token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });
  });

  describe('Appointments Endpoint Guards & Validation', () => {
    it('GET /api/appointments/availability requires valid staffId and date', async () => {
      const res = await request(app)
        .get('/api/appointments/availability')
        .query({ staffId: 'invalid-id', date: '20-10-2026' });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('POST /api/appointments requires authentication', async () => {
      const res = await request(app)
        .post('/api/appointments')
        .send({
          staffId: '507f1f77bcf86cd799439011',
          serviceId: '507f1f77bcf86cd799439012',
          appointmentDate: '2026-10-15',
          startTime: '10:00',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });
  });
});
