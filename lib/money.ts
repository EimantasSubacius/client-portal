export function formatEUR(cents: number): string {
  if (!Number.isInteger(cents)) {
    throw new Error("amountCents must be an integer");
  }
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

/** Parse user euro input like "1500.50" into cents. */
export function parseEuroToCents(input: string): number {
  const normalized = input.trim().replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    throw new Error("Invalid euro amount");
  }
  const [whole, frac = ""] = normalized.split(".");
  const cents = Number(whole) * 100 + Number((frac + "00").slice(0, 2));
  if (!Number.isFinite(cents) || cents <= 0) {
    throw new Error("Amount must be greater than zero");
  }
  return cents;
}
