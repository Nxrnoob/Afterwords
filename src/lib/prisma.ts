import { PrismaClient } from "@prisma/client"

// Force a new instance to bypass HMR global cache for this schema update
export const prisma = new PrismaClient()
console.log("PRISMA MODELS:", Object.keys(prisma).filter(k => !k.startsWith("_")))

/*
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
    globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
*/

export default prisma
