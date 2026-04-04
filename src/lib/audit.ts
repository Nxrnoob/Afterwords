import prisma from "@/lib/prisma";
import { headers } from "next/headers";

interface AuditLogOptions {
  action: string;
  userId?: string;
  entityType?: string;
  entityId?: string;
}

export async function recordAuditLog(options: AuditLogOptions) {
  try {
    const defaultHeaders = await headers();
    const forwardedFor = defaultHeaders.get("x-forwarded-for");
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0] : 'unknown';
    const userAgent = defaultHeaders.get("user-agent") || 'unknown';

    await prisma.auditLog.create({
      data: {
        action: options.action,
        userId: options.userId,
        entityType: options.entityType,
        entityId: options.entityId,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    console.error("Failed to record audit log:", error);
    // Don't throw - audit logging shouldn't crash operations
  }
}
