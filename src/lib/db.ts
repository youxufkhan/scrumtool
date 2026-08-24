import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Member, Project, DailySubmission, DailyTask, Holiday } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-project'));

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) {
    return null;
  }
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
      },
    });
  }
  return supabaseInstance;
}

// In-Memory Mock Store for isolated unit tests or zero-config local demo
export class InMemoryStore {
  members: Member[] = [
    { id: 'm-1', name: 'Alex Rivera', role: 'Frontend Lead', avatar_color: '#3B82F6', is_active: true, joined_at: '2026-01-01', created_at: new Date().toISOString() },
    { id: 'm-2', name: 'Sam Chen', role: 'Backend Engineer', avatar_color: '#10B981', is_active: true, joined_at: '2026-01-01', created_at: new Date().toISOString() },
    { id: 'm-3', name: 'Jordan Taylor', role: 'Fullstack Dev', avatar_color: '#8B5CF6', is_active: true, joined_at: '2026-01-01', created_at: new Date().toISOString() },
    { id: 'm-4', name: 'Morgan Riley', role: 'QA Engineer', avatar_color: '#F59E0B', is_active: true, joined_at: '2026-01-01', created_at: new Date().toISOString() },
  ];

  projects: Project[] = [
    { id: 'p-1', name: 'Core App', color: '#3B82F6', is_active: true, created_at: new Date().toISOString() },
    { id: 'p-2', name: 'Mobile MVP', color: '#10B981', is_active: true, created_at: new Date().toISOString() },
    { id: 'p-3', name: 'Infrastructure', color: '#8B5CF6', is_active: true, created_at: new Date().toISOString() },
    { id: 'p-4', name: 'Bug Fixes', color: '#EF4444', is_active: true, created_at: new Date().toISOString() },
  ];

  submissions: DailySubmission[] = [];
  tasks: DailyTask[] = [];
  holidays: Holiday[] = [];

  clear() {
    this.submissions = [];
    this.tasks = [];
    this.holidays = [];
  }
}

export const mockStore = new InMemoryStore();
