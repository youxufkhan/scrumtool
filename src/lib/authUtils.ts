import crypto from 'crypto';

const SALT = process.env.ADMIN_JWT_SECRET || 'scrumtool_salt';

// In-memory fallback for testing environments where next/headers cookies() is unavailable
const testCookieStore = new Map<string, string>();

/**
 * Clear test cookies store (used in unit test setup)
 */
export function clearTestCookies() {
  testCookieStore.clear();
}

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

/**
 * Safe cookie setter that works in both Next.js Server Actions and test environments
 */
export async function setCookieSafely(name: string, value: string, maxAge = 60 * 60 * 24 * 30) {
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = cookies();
    cookieStore.set(name, value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge,
    });
  } catch {
    testCookieStore.set(name, value);
  }
}

/**
 * Safe cookie getter that works in both Next.js Server Actions and test environments
 */
export async function getCookieSafely(name: string): Promise<string | undefined> {
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = cookies();
    return cookieStore.get(name)?.value;
  } catch {
    return testCookieStore.get(name);
  }
}

/**
 * Safe cookie deleter
 */
export async function deleteCookieSafely(name: string) {
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = cookies();
    cookieStore.delete(name);
  } catch {
    testCookieStore.delete(name);
  }
}

export async function setMemberCookies(memberId: string, token: string) {
  await setCookieSafely('scrumtool_member_id', memberId);
  await setCookieSafely('scrumtool_member_token', token);
}

export async function setAdminCookie(token: string) {
  await setCookieSafely('scrumtool_admin_token', token);
}

export async function clearMemberCookies() {
  await deleteCookieSafely('scrumtool_member_id');
  await deleteCookieSafely('scrumtool_member_token');
}

export async function clearAdminCookie() {
  await deleteCookieSafely('scrumtool_admin_token');
}

export async function getMemberAuthFromCookies(): Promise<{ memberId?: string; token?: string }> {
  const memberId = await getCookieSafely('scrumtool_member_id');
  const token = await getCookieSafely('scrumtool_member_token');
  return { memberId, token };
}

export async function getAdminAuthFromCookies(): Promise<string | undefined> {
  return await getCookieSafely('scrumtool_admin_token');
}
