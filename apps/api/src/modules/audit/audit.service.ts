import { prisma } from '../../lib/prisma';

export async function recordAuditLog(params: {
  actorUserId?: string | null;
  actorEmail?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: unknown;
  ipAddress?: string | null;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        actorUserId: params.actorUserId ?? null,
        actorEmail: params.actorEmail ?? null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId ?? null,
        metadataJson: params.metadata ? (params.metadata as object) : undefined,
        ipAddress: params.ipAddress ?? null,
      },
    });
  } catch (err) {
    console.error('[AuditLog] Failed to persist audit log:', err);
  }
}
