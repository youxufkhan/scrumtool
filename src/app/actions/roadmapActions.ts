'use server';

import crypto from 'crypto';
import { getServerSupabaseClient } from '@/lib/serverDb';
import { requireAdminAuth } from '@/app/actions/adminActions';
import { requireMemberAuth } from '@/app/actions/standupActions';
import { mockStore } from '@/lib/db';
import { MemberRoadmap } from '@/types/database';

/**
 * Saves a new roadmap for a member. The newest roadmap is the active one.
 * Restricted to administrators only.
 */
export async function saveMemberRoadmap(
  data: Omit<MemberRoadmap, 'id' | 'created_at'>
): Promise<{ success: boolean; error?: string }> {
  if (!(await requireAdminAuth())) {
    return { success: false, error: 'Unauthorized: admin access required' };
  }

  const supabase = getServerSupabaseClient();
  if (!supabase) {
    mockStore.memberRoadmaps.push({ ...data, id: crypto.randomUUID(), created_at: new Date().toISOString() });
    return { success: true };
  }

  const { error } = await supabase.from('member_roadmaps').insert([data]);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Retrieves the full roadmap history for a member, ordered newest first.
 * Restricted to administrators only.
 */
export async function getMemberRoadmapHistory(memberId: string): Promise<MemberRoadmap[]> {
  if (!(await requireAdminAuth())) {
    return [];
  }

  const supabase = getServerSupabaseClient();
  if (!supabase) {
    return mockStore.memberRoadmaps.filter((r) => r.member_id === memberId).reverse();
  }

  const { data, error } = await supabase
    .from('member_roadmaps')
    .select('*')
    .eq('member_id', memberId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data as MemberRoadmap[]) || [];
}

/**
 * Retrieves the currently active (newest) roadmap for a member.
 * Accessible to administrators and the member themselves.
 */
export async function getActiveRoadmap(memberId: string): Promise<MemberRoadmap | null> {
  if (!(await requireMemberAuth(memberId)) && !(await requireAdminAuth())) return null;

  const supabase = getServerSupabaseClient();
  if (!supabase) {
    return mockStore.memberRoadmaps.filter((r) => r.member_id === memberId).at(-1) || null;
  }

  const { data, error } = await supabase
    .from('member_roadmaps')
    .select('*')
    .eq('member_id', memberId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as MemberRoadmap) || null;
}
