/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('./src/generated/index.js');
const prisma = new PrismaClient();

async function checkAdmin() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    }
  });
  console.log('用户列表：');
  console.table(users);
  await prisma.$disconnect();
}

checkAdmin().catch(console.error);
