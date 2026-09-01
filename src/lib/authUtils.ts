import crypto from 'crypto';

const SALT = process.env.ADMIN_JWT_SECRET || 'scrumtool_salt';

/**
 * Hash 4-digit passcode using SHA-256 with server-side salt
 */
export function hashPasscode(passcode: string): string {
  return crypto.createHash('sha256').update(`${passcode}:${SALT}`).digest('hex');
}

/**
 * Generate HMAC session token bound to member and current passcode hash
 */
export function generateMemberSessionToken(memberId: string, passcodeHash: string): string {
  return crypto.createHmac('sha256', SALT).update(`${memberId}:${passcodeHash}`).digest('hex');
}
