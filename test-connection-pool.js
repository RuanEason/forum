// 测试 Prisma 连接池配置
const { PrismaClient } = require('./src/generated');

async function testConnectionPool() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    log: ['info', 'error', 'warn'],
  });

  try {
    console.log('开始测试连接池...\n');

    // 测试 1: 单个查询
    console.log('测试 1: 执行单个查询');
    const start1 = Date.now();
    const user1 = await prisma.user.findFirst({ select: { id: true, name: true } });
    console.log(`✓ 查询完成，耗时: ${Date.now() - start1}ms`);
    console.log(`  用户: ${user1?.name}\n`);

    // 测试 2: 并行查询（测试连接池）
    console.log('测试 2: 执行 10 个并行查询');
    const start2 = Date.now();
    const results = await Promise.all(
      Array(10).fill(null).map((_, i) =>
        prisma.user.findFirst({ select: { id: true, name: true } })
      )
    );
    console.log(`✓ 所有查询完成，耗时: ${Date.now() - start2}ms`);
    console.log(`  成功查询数: ${results.length}\n`);

    // 测试 3: 序列查询（测试连接复用）
    console.log('测试 3: 执行 5 个序列查询');
    const start3 = Date.now();
    for (let i = 0; i < 5; i++) {
      await prisma.user.findFirst({ select: { id: true, name: true } });
    }
    console.log(`✓ 所有查询完成，耗时: ${Date.now() - start3}ms\n`);

    console.log('✅ 连接池测试成功！');
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  } finally {
    await prisma.$disconnect();
    console.log('数据库连接已关闭');
  }
}

testConnectionPool();
