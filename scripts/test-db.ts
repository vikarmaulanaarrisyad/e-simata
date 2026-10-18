import prisma from "../src/lib/prisma";

async function main() {
  console.log("Testing database connection...");
  try {
    const categoriesCount = await prisma.category.count();
    console.log("✓ Categories count:", categoriesCount);

    const categories = await prisma.category.findMany({
      include: { fields: true },
      take: 5,
    });
    console.log("Categories:", categories.map(c => ({ id: c.id, name: c.name, fields: c.fields.length })));

    const madrasahs = await prisma.madrasah.findMany();
    console.log("Madrasahs count:", madrasahs.length);
    console.log("Madrasahs:", madrasahs.map(m => m.name));

    const submissionsCount = await prisma.submission.count();
    console.log("Submissions count:", submissionsCount);

    const filesCount = await prisma.uploadedFile.count();
    console.log("Uploaded files count:", filesCount);

    console.log("Database connection is FULLY WORKING!");
  } catch (err) {
    console.error("Database connection error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
