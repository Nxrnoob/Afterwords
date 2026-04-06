import { PrismaClient } from "@prisma/client"

// Global singleton to prevent too many DB connections in dev (Next.js HMR)
// and on serverless cold starts in production (Vercel)
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
    globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

export default prisma
