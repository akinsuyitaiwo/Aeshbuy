import { PrismaClient, RoleCode } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  await Promise.all(
    Object.values(RoleCode).map((code) =>
      prisma.role.upsert({
        where: { code },
        create: { code, description: `${code} platform role` },
        update: {},
      }),
    ),
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
