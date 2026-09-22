'use server';

import crypto from 'crypto';
import { getServerSupabaseClient } from '@/lib/serverDb';
import { requireAdminAuth } from '@/app/actions/adminActions';
import { requireMemberAuth } from '@/app/actions/standupActions';
import { mockStore } from '@/lib/db';
import { MemberRoadmap } from '@/types/database';

/**
 * Saves a new roadmap for a member. Old roadmaps for this member are deactivated.
 * Restricted to administrators only.
 */
export async function saveMemberRoadmap(
  data: Omit<MemberRoadmap, 'id' | 'created_at' | 'is_active'>
): Promise<{ success: boolean; error?: string }> {
  if (!(await requireAdminAuth())) {
    return { success: false, error: 'Unauthorized: admin access required' };
  }

  const supabase = getServerSupabaseClient();
  if (!supabase) {
    mockStore.memberRoadmaps.forEach((r) => {
      if (r.member_id === data.member_id) r.is_active = false;
    });

    const newRoadmap: MemberRoadmap = {
      ...data,
      id: crypto.randomUUID(),
      is_active: true,
      created_at: new Date().toISOString(),
    };
    mockStore.memberRoadmaps.push(newRoadmap);
    return { success: true };
  }

  const { error: updateError } = await supabase
    .from('member_roadmaps')
    .update({ is_active: false })
    .eq('member_id', data.member_id);
  if (updateError) return { success: false, error: updateError.message };

  const { error } = await supabase.from('member_roadmaps').insert([{ ...data, is_active: true }]);
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
    return mockStore.memberRoadmaps
      .filter((r) => r.member_id === memberId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  const { data } = await supabase
    .from('member_roadmaps')
    .select('*')
    .eq('member_id', memberId)
    .order('created_at', { ascending: false });
  return (data as MemberRoadmap[]) || [];
}

/**
 * Retrieves the currently active roadmap for a member.
 * Accessible to administrators and the member themselves.
 */
export async function getActiveRoadmap(memberId: string): Promise<MemberRoadmap | null> {
  const isMember = await requireMemberAuth(memberId);
  const isAdmin = isMember ? false : await requireAdminAuth();
  if (!isMember && !isAdmin) return null;

  const supabase = getServerSupabaseClient();
  if (!supabase) {
    return mockStore.memberRoadmaps.find((r) => r.member_id === memberId && r.is_active) || null;
  }

  const { data } = await supabase
    .from('member_roadmaps')
    .select('*')
    .eq('member_id', memberId)
    .eq('is_active', true)
    .maybeSingle();
  return (data as MemberRoadmap) || null;
}
