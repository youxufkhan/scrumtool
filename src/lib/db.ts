import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Member, Project, DailySubmission, DailyTask, Holiday } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  (supabaseServiceKey || supabaseAnonKey) &&
  !supabaseUrl.includes('your-project')
);

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) {
    return null;
  }
  const key = supabaseServiceKey || supabaseAnonKey;
  if (!key) return null;

  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, key, {
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
    { id: 'm-1', name: 'Alex Rivera', role: 'Frontend Lead', avatar_color: '#3B82F6', is_active: true, passcode_hash: '93369f4b5512e84a0d5b1cbd8c54e0aaec37b40a8753fd03c156dd712ce45d50', has_custom_passcode: false, joined_at: '2026-01-01', created_at: new Date().toISOString() },
    { id: 'm-2', name: 'Sam Chen', role: 'Backend Engineer', avatar_color: '#10B981', is_active: true, passcode_hash: '93369f4b5512e84a0d5b1cbd8c54e0aaec37b40a8753fd03c156dd712ce45d50', has_custom_passcode: false, joined_at: '2026-01-01', created_at: new Date().toISOString() },
    { id: 'm-3', name: 'Jordan Taylor', role: 'Fullstack Dev', avatar_color: '#8B5CF6', is_active: true, passcode_hash: '93369f4b5512e84a0d5b1cbd8c54e0aaec37b40a8753fd03c156dd712ce45d50', has_custom_passcode: false, joined_at: '2026-01-01', created_at: new Date().toISOString() },
    { id: 'm-4', name: 'Morgan Riley', role: 'QA Engineer', avatar_color: '#F59E0B', is_active: true, passcode_hash: '93369f4b5512e84a0d5b1cbd8c54e0aaec37b40a8753fd03c156dd712ce45d50', has_custom_passcode: false, joined_at: '2026-01-01', created_at: new Date().toISOString() },
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
