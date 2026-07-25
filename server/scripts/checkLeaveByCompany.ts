import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const companies = await prisma.company.findMany({
    select: { id: true, name: true, code: true },
  });
  console.log("COMPANIES", companies);

  const usersByCompany = await prisma.user.groupBy({
    by: ["companyId"],
    _count: { _all: true },
  });
  console.log("USERS_BY_COMPANY", usersByCompany);

  const leaves = await prisma.leaveRequest.findMany({
    select: {
      id: true,
      user: {
        select: {
          companyId: true,
        },
      },
    },
  });

  const grouped: Record<string, number> = {};
  for (const leave of leaves) {
    const cid = leave.user.companyId;
    grouped[cid] = (grouped[cid] || 0) + 1;
  }

  console.log("LEAVES_BY_COMPANY", grouped);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
