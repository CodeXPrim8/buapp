// Audit logging system for security events and admin actions

import { supabase } from './supabase'

export interface AuditLogEntry {
  event_type: string
  user_id?: string
  user_role?: string
  ip_address?: string
  user_agent?: string
  resource_type?: string // 'user', 'event', 'transaction', etc.
  resource_id?: string
  action: string // 'login', 'logout', 'create', 'update', 'delete', 'view', etc.
  status: 'success' | 'failure' | 'error'
  metadata?: Record<string, any>
  error_message?: string
}

/**
 * Log an audit event
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  try {
    // In production, you should have an audit_logs table in Supabase
    // For now, we'll log to console and optionally to a table
    
    const logEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
    }
    
    // Console logging (always)
    console.log('[AUDIT LOG]', JSON.stringify(logEntry, null, 2))
    
    // Try to insert into audit_logs table if it exists
    // You'll need to create this table in Supabase:
    /*
    CREATE TABLE audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event_type TEXT NOT NULL,
      user_id UUID REFERENCES users(id),
      user_role TEXT,
      ip_address TEXT,
      user_agent TEXT,
      resource_type TEXT,
      resource_id TEXT,
      action TEXT NOT NULL,
      status TEXT NOT NULL,
      metadata JSONB,
      error_message TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
    CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
    CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
    */
    
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        event_type: entry.event_type,
        user_id: entry.user_id,
        user_role: entry.user_role,
        ip_address: entry.ip_address,
        user_agent: entry.user_agent,
        resource_type: entry.resource_type,
        resource_id: entry.resource_id,
        action: entry.action,
        status: entry.status,
        metadata: entry.metadata || {},
        error_message: entry.error_message,
      })
      .select()
    
    if (error) {
      // Table might not exist yet, that's okay - we still logged to console
      console.warn('[AUDIT LOG] Failed to write to database (table may not exist):', error.message)
    }
  } catch (error: any) {
    // Never fail the main operation due to audit logging failure
    console.error('[AUDIT LOG] Error logging audit event:', error)
  }
}

/**
 * Helper to extract IP address from request
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  return forwarded?.split(',')[0] || realIP || 'unknown'
}

/**
 * Helper to extract user agent from request
 */
export function getUserAgent(request: Request): string {
  return request.headers.get('user-agent') || 'unknown'
}

/**
 * Log login attempt
 */
export async function logLoginAttempt(
  userId: string | null,
  role: string | null,
  success: boolean,
  ipAddress: string,
  userAgent: string,
  errorMessage?: string
): Promise<void> {
  await logAuditEvent({
    event_type: 'authentication',
    user_id: userId || undefined,
    user_role: role || undefined,
    ip_address: ipAddress,
    user_agent: userAgent,
    action: 'login',
    status: success ? 'success' : 'failure',
    error_message: errorMessage,
  })
}

/**
 * Log admin action
 */
export async function logAdminAction(
  userId: string,
  role: string,
  action: string,
  resourceType: string,
  resourceId: string,
  ipAddress: string,
  userAgent: string,
  metadata?: Record<string, any>
): Promise<void> {
  await logAuditEvent({
    event_type: 'admin_action',
    user_id: userId,
    user_role: role,
    ip_address: ipAddress,
    user_agent: userAgent,
    resource_type: resourceType,
    resource_id: resourceId,
    action,
    status: 'success',
    metadata,
  })
}
