import AuditLog from '@/models/AuditLog';

function clean(value) {
  if (!value) return value;
  if (typeof value.toObject === 'function') return value.toObject();
  return value;
}

export async function logAudit({ action, session, targetId, oldValues = null, newValues = null }) {
  if (!session) return null;

  return AuditLog.create({
    action,
    performedBy: session.email,
    role: session.role,
    targetId: targetId?.toString(),
    oldValues: clean(oldValues),
    newValues: clean(newValues),
  });
}
