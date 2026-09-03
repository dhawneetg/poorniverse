import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Read from import.meta.env (.env file) or LocalStorage settings
export function getSupabaseConfig(): { url: string; key: string } {
  const envUrl = (import.meta as any).env?.PUBLIC_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.PUBLIC_SUPABASE_ANON_KEY || '';

  if (envUrl && envKey) {
    return { url: envUrl, key: envKey };
  }

  if (typeof window !== 'undefined') {
    try {
      const storedUrl = localStorage.getItem('supabase_url') || '';
      const storedKey = localStorage.getItem('supabase_key') || '';
      return { url: storedUrl, key: storedKey };
    } catch {
      return { url: '', key: '' };
    }
  }

  return { url: '', key: '' };
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const { url, key } = getSupabaseConfig();
  if (!url || !key) return null;

  if (!supabaseInstance) {
    supabaseInstance = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return supabaseInstance;
}

export function resetSupabaseClient(url: string, key: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('supabase_url', url);
    localStorage.setItem('supabase_key', key);
  }
  if (url && key) {
    supabaseInstance = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  } else {
    supabaseInstance = null;
  }
  return supabaseInstance;
}
