import mongoose from 'mongoose';
import argon2 from 'argon2';
import env from './environment.js';
import User from '../models/User.js';
import Staff from '../models/Staff.js';
import Service from '../models/Service.js';
import Offer from '../models/Offer.js';
import Customer from '../models/Customer.js';
import { ROLES, SERVICE_CATEGORY, OFFER_TYPE } from '../constants/index.js';
import logger from '../utils/logger.js';

async function seed() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    logger.info('Connected to MongoDB for seeding');

    // 1. Seed Owner Admin
    let owner = await User.findOne({ email: 'admin@salon.com' });
    if (!owner) {
      const passwordHash = await argon2.hash('Admin@Salon2026!');
      owner = await User.create({
        name: 'Salon Owner',
        email: 'admin@salon.com',
        passwordHash,
        role: ROLES.OWNER,
        isActive: true,
      });
      logger.info('Created Owner account: admin@salon.com');
    }

    // 2. Seed Services
    const sampleServices = [
      {
        name: 'Signature Haircut & Blowdry',
        description: 'Complete hair wash, precision haircut, and salon blowdry styling.',
        category: SERVICE_CATEGORY.HAIR,
        duration: 45,
        bufferTime: 10,
        price: 650,
        isActive: true,
        sortOrder: 1,
      },
      {
        name: 'Keratin Hair Spa & Treatment',
        description: 'Intense nourishment and damage repair therapy with pure Moroccan argan oil.',
        category: SERVICE_CATEGORY.HAIR,
        duration: 60,
        bufferTime: 15,
        price: 1800,
        isActive: true,
        sortOrder: 2,
      },
      {
        name: 'Gold Radiance Glow Facial',
        description: 'Luxury 24k gold dust facial with steam, extraction, and cooling jade roller.',
        category: SERVICE_CATEGORY.SKIN,
        duration: 60,
        bufferTime: 10,
        price: 1600,
        isActive: true,
        sortOrder: 3,
      },
      {
        name: 'Hydra-Boost Deep Cleanse Facial',
        description: 'Multi-step clinical facial for deep hydration, blackhead clearing, and brightening.',
        category: SERVICE_CATEGORY.SKIN,
        duration: 50,
        bufferTime: 10,
        price: 1350,
        isActive: true,
        sortOrder: 4,
      },
      {
        name: 'Deluxe Gel Manicure & Pedicure',
        description: 'Exfoliation, cuticle treatment, organic scrub, massage, and long-lasting gel polish.',
        category: SERVICE_CATEGORY.NAILS,
        duration: 75,
        bufferTime: 15,
        price: 1200,
        isActive: true,
        sortOrder: 5,
      },
      {
        name: 'Swedish Aromatherapy Body Massage',
        description: 'Full-body stress relief massage using therapeutic essential oils.',
        category: SERVICE_CATEGORY.SPA,
        duration: 60,
        bufferTime: 15,
        price: 2400,
        isActive: true,
        sortOrder: 6,
      },
      {
        name: 'HD Party & Evening Makeup',
        description: 'Flawless high-definition makeup with eyelash application and contouring.',
        category: SERVICE_CATEGORY.MAKEUP,
        duration: 90,
        bufferTime: 15,
        price: 3500,
        isActive: true,
        sortOrder: 7,
      },
    ];

    const services = [];
    for (const s of sampleServices) {
      let svc = await Service.findOne({ name: s.name });
      if (!svc) {
        svc = await Service.create(s);
      }
      services.push(svc);
    }
    logger.info(`Seeded ${services.length} services`);

    // 3. Seed Staff Members
    const staffMembers = [
      {
        name: 'Priya Sharma',
        email: 'priya@salon.com',
        phone: '9876543201',
        bio: 'Senior Hair Stylist with 7+ years of experience in cuts and color treatments.',
        role: ROLES.STAFF,
        serviceNames: ['Signature Haircut & Blowdry', 'Keratin Hair Spa & Treatment'],
      },
      {
        name: 'Ananya Patel',
        email: 'ananya@salon.com',
        phone: '9876543202',
        bio: 'Certified Skin & Aesthetic Specialist specializing in therapeutic facials.',
        role: ROLES.STAFF,
        serviceNames: ['Gold Radiance Glow Facial', 'Hydra-Boost Deep Cleanse Facial', 'HD Party & Evening Makeup'],
      },
      {
        name: 'Rohit Verma',
        email: 'rohit@salon.com',
        phone: '9876543203',
        bio: 'Licensed Massage Therapist skilled in Swedish and deep tissue wellness massages.',
        role: ROLES.STAFF,
        serviceNames: ['Swedish Aromatherapy Body Massage', 'Deluxe Gel Manicure & Pedicure'],
      },
    ];

    for (const sm of staffMembers) {
      let user = await User.findOne({ email: sm.email });
      if (!user) {
        const pass = await argon2.hash('Staff@Salon2026!');
        user = await User.create({
          name: sm.name,
          email: sm.email,
          passwordHash: pass,
          role: sm.role,
          isActive: true,
        });
      }

      let staffDoc = await Staff.findOne({ user: user._id });
      const matchedServiceIds = services
        .filter((s) => sm.serviceNames.includes(s.name))
        .map((s) => s._id);

      const workingHours = [
        { dayOfWeek: 0, isWorking: false, startTime: '09:00', endTime: '19:00' }, // Sunday off
        { dayOfWeek: 1, isWorking: true, startTime: '09:00', endTime: '19:00' },
        { dayOfWeek: 2, isWorking: true, startTime: '09:00', endTime: '19:00' },
        { dayOfWeek: 3, isWorking: true, startTime: '09:00', endTime: '19:00' },
        { dayOfWeek: 4, isWorking: true, startTime: '09:00', endTime: '19:00' },
        { dayOfWeek: 5, isWorking: true, startTime: '09:00', endTime: '19:00' },
        { dayOfWeek: 6, isWorking: true, startTime: '09:00', endTime: '19:00' },
      ];

      if (!staffDoc) {
        await Staff.create({
          user: user._id,
          name: sm.name,
          email: sm.email,
          phone: sm.phone,
          bio: sm.bio,
          services: matchedServiceIds,
          workingHours,
          isActive: true,
        });
        logger.info(`Seeded staff: ${sm.name}`);
      }
    }

    // 4. Seed Offers
    const sampleOffers = [
      {
        title: 'New Customer Welcome',
        code: 'WELCOME20',
        type: OFFER_TYPE.PERCENTAGE,
        value: 20,
        maxDiscountAmount: 400,
        minOrderAmount: 500,
        isActive: true,
      },
      {
        title: 'Flat ₹300 Off on Spa & Facials',
        code: 'GLOW300',
        type: OFFER_TYPE.FLAT,
        value: 300,
        minOrderAmount: 1200,
        isActive: true,
      },
    ];

    for (const off of sampleOffers) {
      const existing = await Offer.findOne({ code: off.code });
      if (!existing) {
        await Offer.create(off);
        logger.info(`Seeded offer: ${off.code}`);
      }
    }

    // 5. Seed Demo Customer
    const demoCustomerPhone = '9876543210';
    let demoCustomer = await Customer.findOne({ phone: demoCustomerPhone });
    if (!demoCustomer) {
      demoCustomer = await Customer.create({
        name: 'Sunita Rao',
        phone: demoCustomerPhone,
        email: 'sunita.rao@example.com',
        gender: 'FEMALE',
        isActive: true,
      });
      logger.info('Seeded demo customer: Sunita Rao (9876543210)');
    }

    logger.info('✅ Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
