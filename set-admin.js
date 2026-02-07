const { PrismaClient } = require('./src/generated/index.js');
const prisma = new PrismaClient();

async function setAdmin() {
  // 修改邮箱为 '3630987098@qq.com' 的用户为管理员
  const user = await prisma.user.update({
    where: { email: '3630987098@qq.com' },
    data: { role: 'admin' }
  });
  console.log(`用户 ${user.name} (${user.email}) 已设置为管理员`);
  await prisma.$disconnect();
}

setAdmin().catch(console.error);
