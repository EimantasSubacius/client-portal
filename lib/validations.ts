import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const createClientSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(80),
  companyName: z.string().min(2).max(120),
  temporaryPassword: z.string().min(8).max(72),
});

export const createProjectSchema = z.object({
  title: z.string().trim().min(2).max(80),
  description: z.string().max(5000).default(""),
  clientUserId: z.string().min(1),
  status: z.enum(["ACTIVE", "PAUSED", "DONE"]).default("ACTIVE"),
});

export const updateProjectSchema = z.object({
  title: z.string().trim().min(2).max(80).optional(),
  description: z.string().max(5000).optional(),
  status: z.enum(["ACTIVE", "PAUSED", "DONE"]).optional(),
  clientUserId: z.string().min(1).optional(),
});

export const createInvoiceSchema = z.object({
  clientUserId: z.string().min(1),
  projectId: z.string().min(1).optional().nullable(),
  amountEuros: z.string().min(1),
  status: z.enum(["DRAFT", "SENT", "PAID"]).default("DRAFT"),
  dueDate: z.string().datetime().optional().nullable(),
  note: z.string().max(1000).optional().nullable(),
});

export const updateInvoiceSchema = z.object({
  status: z.enum(["DRAFT", "SENT", "PAID"]),
});

export const postMessageSchema = z.object({
  body: z.string().trim().min(1).max(5000),
});
