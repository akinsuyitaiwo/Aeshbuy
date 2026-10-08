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
  const permission = await prisma.permission.upsert({
    where: { code: 'merchants.review' },
    create: { code: 'merchants.review', description: 'Review merchant applications' },
    update: {},
  });
  const adminRoles = await prisma.role.findMany({ where: { code: { in: [RoleCode.ADMIN, RoleCode.SUPER_ADMIN] } } });
  await Promise.all(adminRoles.map((role) => prisma.rolePermission.upsert({
    where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
    create: { roleId: role.id, permissionId: permission.id }, update: {},
  })));
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
