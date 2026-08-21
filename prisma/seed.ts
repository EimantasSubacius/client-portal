import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/password";

const prisma = new PrismaClient();

async function main() {
  await prisma.message.deleteMany();
  await prisma.fileAsset.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.invoiceSequence.deleteMany();
  await prisma.project.deleteMany();
  await prisma.clientProfile.deleteMany();
  await prisma.user.deleteMany();

  const adminHash = await hashPassword("DemoAdmin123!");
  const clientHash = await hashPassword("DemoClient123!");

  const admin = await prisma.user.create({
    data: {
      email: "admin@demo.portal",
      name: "Demo Admin",
      role: "ADMIN",
      passwordHash: adminHash,
    },
  });

  const client = await prisma.user.create({
    data: {
      email: "client@demo.portal",
      name: "Demo Client",
      role: "CLIENT",
      passwordHash: clientHash,
      clientProfile: {
        create: {
          companyName: "UAB Demo Client",
          notes: "Seeded demo company",
        },
      },
    },
  });

  const website = await prisma.project.create({
    data: {
      title: "Website redesign",
      description: "Marketing site refresh and CMS handoff.",
      status: "ACTIVE",
      clientUserId: client.id,
    },
  });

  const seo = await prisma.project.create({
    data: {
      title: "SEO retainer",
      description: "Monthly technical SEO and content briefs.",
      status: "PAUSED",
      clientUserId: client.id,
    },
  });

  await prisma.invoiceSequence.create({ data: { year: 2026, lastValue: 2 } });

  await prisma.invoice.createMany({
    data: [
      {
        number: "INV-2026-0001",
        clientUserId: client.id,
        projectId: website.id,
        amountCents: 150000,
        status: "SENT",
        dueDate: new Date("2026-09-01"),
        note: "Kickoff + design phase",
      },
      {
        number: "INV-2026-0002",
        clientUserId: client.id,
        projectId: seo.id,
        amountCents: 50000,
        status: "PAID",
        dueDate: new Date("2026-07-01"),
        note: "July retainer",
      },
    ],
  });

  await prisma.message.createMany({
    data: [
      {
        projectId: website.id,
        authorId: admin.id,
        body: "Welcome! I uploaded the first sitemap draft to Files.",
        readByClientAt: null,
      },
      {
        projectId: website.id,
        authorId: client.id,
        body: "Thanks. Can we keep the homepage hero shorter?",
        readByAdminAt: null,
      },
      {
        projectId: website.id,
        authorId: admin.id,
        body: "Yes. I will send a tighter hero option tomorrow.",
        readByClientAt: null,
      },
      {
        projectId: seo.id,
        authorId: admin.id,
        body: "SEO retainer is paused until content inventory is ready.",
        readByClientAt: null,
      },
    ],
  });

  console.log("Seed OK");
  console.log("Admin: admin@demo.portal / DemoAdmin123!");
  console.log("Client: client@demo.portal / DemoClient123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
