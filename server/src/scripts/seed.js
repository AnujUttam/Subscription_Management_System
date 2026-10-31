const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const connectDB = require('../config/db');
const User = require('../models/User');

const seedUsers = async () => {
  console.log('[Seed] Starting database seeding process...');

  const isConnected = await connectDB();
  if (!isConnected) {
    console.error('[Seed] Database connection failed. Aborting seed script.');
    process.exit(1);
  }

  try {
    const demoUsers = [
      {
        name: 'Demo Admin',
        email: 'admin@brightloop.io',
        plainPassword: 'Admin@123',
        role: 'admin'
      },
      {
        name: 'Demo Staff',
        email: 'staff@brightloop.io',
        plainPassword: 'Staff@123',
        role: 'staff'
      }
    ];

    for (const userData of demoUsers) {
      const existingUser = await User.findOne({ email: userData.email.toLowerCase() });

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(userData.plainPassword, salt);

      if (existingUser) {
        existingUser.name = userData.name;
        existingUser.role = userData.role;
        existingUser.passwordHash = passwordHash;
        await existingUser.save();
        console.log(`[Seed] Updated existing user: ${userData.email} (Role: ${userData.role})`);
      } else {
        await User.create({
          name: userData.name,
          email: userData.email.toLowerCase(),
          passwordHash,
          role: userData.role
        });
        console.log(`[Seed] Created new user: ${userData.email} (Role: ${userData.role})`);
      }
    }

    console.log('[Seed] Seeding completed successfully without exposing credentials.');
  } catch (error) {
    console.error(`[Seed] Error during seeding: ${error.message}`);
  } finally {
    await mongoose.connection.close();
    console.log('[Seed] Database connection closed.');
    process.exit(0);
  }
};

seedUsers();
