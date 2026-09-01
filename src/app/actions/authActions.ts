'use server';

import { getMemberAuthFromCookies, getAdminAuthFromCookies } from '@/lib/authUtils';
import { verifyMemberSession } from './standupActions';
import { requireAdminAuth } from './adminActions';

/**
 * Checks if the current request has valid member authentication cookies
 */
export async function checkInitialMemberAuth(): Promise<{ isAuthenticated: boolean; memberId: string | null }> {
  const auth = await getMemberAuthFromCookies();
  if (auth.memberId && auth.token) {
    const isValid = await verifyMemberSession(auth.memberId, auth.token);
    if (isValid) {
      return { isAuthenticated: true, memberId: auth.memberId };
    }
  }
  return { isAuthenticated: false, memberId: null };
}

/**
 * Checks if the current request has valid admin authentication cookie
 */
export async function checkInitialAdminAuth(): Promise<boolean> {
  return await requireAdminAuth();
}
