require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seedUsers() {
  try {
    const adminUsers = [
      {
        mobile: process.env.ADMIN_USER_1_MOBILE,
        password: process.env.ADMIN_USER_1_PASS,
        name: process.env.ADMIN_USER_1_NAME || 'Admin 1',
        role: process.env.ADMIN_USER_1_ROLE || 'Store_Incharge',
      },
      {
        mobile: process.env.ADMIN_USER_2_MOBILE,
        password: process.env.ADMIN_USER_2_PASS,
        name: process.env.ADMIN_USER_2_NAME || 'Admin 2',
        role: process.env.ADMIN_USER_2_ROLE || 'Store_Incharge',
      }
    ].filter(u => u.mobile && u.password);

    for (const u of adminUsers) {
      const exists = await prisma.user.findUnique({ where: { mobile: u.mobile } });
      if (!exists) {
        const hashedPassword = await bcrypt.hash(u.password, 10);
        await prisma.user.create({
          data: {
            mobile: u.mobile,
            password: hashedPassword,
            name: u.name,
            role: u.role,
            isActive: true
          }
        });
        console.log(`User ${u.name} (${u.mobile}) seeded successfully.`);
      } else {
        console.log(`User ${u.name} (${u.mobile}) already exists.`);
      }
    }
    console.log('Seeding completed.');
  } catch (error) {
    console.error('Error seeding users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedUsers();
