import { PrismaClient } from "../generated/prisma/client.ts";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  const adapter = new PrismaNeonHttp(url, { arrayMode: true });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
