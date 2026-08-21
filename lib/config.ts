import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(32),
  APP_URL: z.string().url().default("http://localhost:3000"),
  DEMO_LOGIN_HINTS: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  STORAGE_DRIVER: z.enum(["local", "blob"]).default("local"),
  UPLOAD_DIR: z.string().default("./uploads"),
  MAX_UPLOAD_BYTES: z.coerce.number().default(10 * 1024 * 1024),
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  VERCEL: z.string().optional(),
});

export type AppConfig = z.infer<typeof envSchema> & {
  isProd: boolean;
};

let cached: AppConfig | null = null;

export function getConfig(): AppConfig {
  if (cached) return cached;

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join("; ");
    throw new Error(`Invalid environment: ${msg}`);
  }

  const data = parsed.data;
  const isProd = process.env.NODE_ENV === "production" || data.VERCEL === "1";

  if (isProd && data.STORAGE_DRIVER !== "blob") {
    throw new Error(
      "P0: production requires STORAGE_DRIVER=blob and BLOB_READ_WRITE_TOKEN",
    );
  }
  if (data.STORAGE_DRIVER === "blob" && !data.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN is required when STORAGE_DRIVER=blob");
  }

  cached = { ...data, isProd };
  return cached;
}

/** Read demo hint flag without swallowing storage/config hard failures. */
export function demoHintsEnabled(): boolean {
  return process.env.DEMO_LOGIN_HINTS === "true";
}

/** Call early on sensitive server routes to enforce prod storage rules. */
export function assertProdStorageConfig(): void {
  if (process.env.NODE_ENV === "production" || process.env.VERCEL === "1") {
    getConfig();
  }
}
