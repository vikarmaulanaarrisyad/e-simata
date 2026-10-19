import prisma from "../src/lib/prisma";

async function main() {
  console.log("Updating category file size limits in database to 500 MB...");

  const updateResult = await prisma.category.updateMany({
    data: {
      maxFileSizeMb: 500,
    },
  });

  console.log(`✓ Successfully updated ${updateResult.count} categories to maxFileSizeMb = 500 MB!`);

  const updatedCategories = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
      maxFileSizeMb: true,
      isActive: true,
    },
    orderBy: { orderIndex: "asc" },
  });

  console.table(updatedCategories);
}

main()
  .catch((e) => {
    console.error("Failed to update categories:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
