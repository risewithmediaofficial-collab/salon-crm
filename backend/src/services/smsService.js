import twilio from 'twilio';
import env from '../config/environment.js';
import logger from '../utils/logger.js';

let twilioClient = null;

function getTwilioClient() {
  if (twilioClient) return twilioClient;
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN) {
    logger.warn('Twilio credentials not configured — SMS will be logged only');
    return null;
  }
  try {
    twilioClient = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
    return twilioClient;
  } catch (err) {
    logger.warn(`Failed to initialize Twilio client: ${err.message}`);
    return null;
  }
}

/**
 * Send an OTP SMS to a phone number.
 * Falls back to console logging in dev/when Twilio is not configured.
 *
 * @param {string} phone - E.164 format: +91XXXXXXXXXX
 * @param {string} otp
 * @returns {Promise<boolean>}
 */
export async function sendOTPSMS(phone, otp) {
  const message = `Your ${env.SALON_NAME} verification code is: ${otp}. Valid for ${env.OTP_EXPIRY_MINUTES} minutes. Do not share this code.`;

  if (env.isDevelopment() || !env.TWILIO_ACCOUNT_SID) {
    // In development, log to console instead of sending real SMS
    logger.info(`[DEV] OTP for ${phone}: ${otp}`);
    console.log(`\n🔑 OTP for ${phone}: ${otp}\n`);
    return true;
  }

  try {
    const client = getTwilioClient();
    if (!client) return false;
    await client.messages.create({
      body: message,
      from: env.TWILIO_PHONE_NUMBER,
      to: phone,
    });
    logger.info(`OTP SMS sent to ${phone}`);
    return true;
  } catch (error) {
    logger.error('Failed to send OTP SMS', { phone, error: error.message });
    throw error;
  }
}

/**
 * Send a generic SMS notification
 * @param {string} phone
 * @param {string} message
 */
export async function sendSMS(phone, message) {
  if (env.isDevelopment() || !env.TWILIO_ACCOUNT_SID) {
    logger.info(`[DEV] SMS to ${phone}: ${message}`);
    return true;
  }

  try {
    const client = getTwilioClient();
    if (!client) return false;
    await client.messages.create({
      body: message,
      from: env.TWILIO_PHONE_NUMBER,
      to: phone,
    });
    return true;
  } catch (error) {
    logger.error('Failed to send SMS', { phone, error: error.message });
    return false; // notification failures should not break business flow
  }
}
