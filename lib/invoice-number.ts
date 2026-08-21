import { prisma } from "@/lib/db";

export async function nextInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();

  const result = await prisma.$transaction(async (tx) => {
    await tx.invoiceSequence.upsert({
      where: { year },
      create: { year, lastValue: 0 },
      update: {},
    });
    const seq = await tx.invoiceSequence.update({
      where: { year },
      data: { lastValue: { increment: 1 } },
    });
    return `INV-${year}-${String(seq.lastValue).padStart(4, "0")}`;
  });

  return result;
}
