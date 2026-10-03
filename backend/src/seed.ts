import { prisma } from "./prisma";

async function main() {
  // Check if users already exist
  const existingUsers = await prisma.user.count();
  if (existingUsers > 0) {
    console.log("Database already seeded!");
    return;
  }

  const user = await prisma.user.create({
    data: {
      id: "USR-01",
      name: "Kiran Bhati",
      email: "kiran.bhati@airdive.example",
      role: "Sales Manager",
    }
  });
  
  await prisma.user.create({
    data: {
      id: "USR-02",
      name: "Aarav Mehta",
      email: "aarav.mehta@airdive.example",
      role: "Sales Executive",
    }
  });

  await prisma.product.create({
    data: {
      id: "PRD-001",
      sku: "NEX-SVR-X1",
      name: "Nexora Enterprise Server X1",
      category: "Hardware",
      kind: "Hardware",
      price: 250000,
      onHand: 10,
    }
  });

  console.log("Seeding finished.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
