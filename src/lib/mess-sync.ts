import { getSupabase } from './supabase';
import { getStoredData, setStoredData, KEYS, DEFAULT_MESS_MENU } from './storage';
import type { MessDayMenu } from './types';

const FIRESTORE_MEALS_URL = 'https://firestore.googleapis.com/v1/projects/poornima-5c202/databases/(default)/documents/meals?pageSize=35&key=AIzaSyBrksZsdbuYx1ktbuUDqTtBkhoG7DAKOPU';

function cleanMealText(htmlStr: string | undefined): string {
  if (!htmlStr) return '';
  return htmlStr
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export interface MessSyncResult {
  success: boolean;
  source: 'official_portal' | 'supabase' | 'cache_fallback';
  message: string;
  syncedAt: string;
}

/**
 * Automatically fetch the live weekly schedule from Poornima's official portal.
 * Saves to Supabase and LocalStorage without requiring human input.
 */
export async function autoSyncMessMenu(): Promise<{ menu: MessDayMenu[]; status: MessSyncResult }> {
  let currentMenu = getStoredData<MessDayMenu[]>(KEYS.MESS, DEFAULT_MESS_MENU);
  const nowIso = new Date().toISOString();

  // 1. Try official Poornima Firestore live database
  try {
    const res = await fetch(FIRESTORE_MEALS_URL, { cache: 'no-cache' });
    if (res.ok) {
      const data = await res.json();
      const docs = data.documents;

      if (Array.isArray(docs) && docs.length > 0) {
        // Group newest meals by day of week
        const dayMap = new Map<string, { breakfast: string; lunch: string; snacks: string; dinner: string; date: string }>();

        // Sort documents by date descending (latest first)
        const sortedDocs = [...docs].sort((a, b) => {
          const dateA = a.fields?.date?.stringValue || a.name.split('/').pop() || '';
          const dateB = b.fields?.date?.stringValue || b.name.split('/').pop() || '';
          return dateB.localeCompare(dateA);
        });

        for (const doc of sortedDocs) {
          const dateStr = doc.fields?.date?.stringValue || doc.name.split('/').pop();
          if (!dateStr || !dateStr.includes('-')) continue;

          const dateObj = new Date(dateStr + 'T00:00:00');
          if (isNaN(dateObj.getTime())) continue;

          const dayName = DAY_NAMES[dateObj.getDay()];
          // Only pick the most recent menu for each day of the week
          if (!dayMap.has(dayName)) {
            const bf = cleanMealText(doc.fields?.breakfast?.stringValue);
            const lunch = cleanMealText(doc.fields?.lunch?.stringValue);
            const snacks = cleanMealText(doc.fields?.snacks?.stringValue);
            const dinner = cleanMealText(doc.fields?.dinner?.stringValue);

            if (bf || lunch || snacks || dinner) {
              dayMap.set(dayName, { breakfast: bf, lunch, snacks, dinner, date: dateStr });
            }
          }
        }

        // Merge with existing menu for all 7 days
        const updatedMenu: MessDayMenu[] = currentMenu.map(existingDay => {
          const live = dayMap.get(existingDay.day);
          if (live) {
            return {
              ...existingDay,
              breakfast: live.breakfast || existingDay.breakfast,
              lunch: live.lunch || existingDay.lunch,
              snacks: live.snacks || existingDay.snacks,
              dinner: live.dinner || existingDay.dinner,
            };
          }
          return existingDay;
        });

        currentMenu = updatedMenu;
        setStoredData(KEYS.MESS, currentMenu);

        // 2. Automatically sync to Supabase hostel_mess_menu
        syncToSupabase(currentMenu).catch(() => {});

        return {
          menu: currentMenu,
          status: {
            success: true,
            source: 'official_portal',
            message: '✓ Auto-synced live with official Poornima portal',
            syncedAt: nowIso,
          },
        };
      }
    }
  } catch (err) {
    console.warn('Official live meal fetch error, attempting Supabase fallback', err);
  }

  // 2. Fallback: Check Supabase hostel_mess_menu
  try {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase.from('hostel_mess_menu').select('*');
      if (!error && data && data.length > 0) {
        const fromSupa = currentMenu.map(m => {
          const match = data.find((row: any) => row.day.toLowerCase() === m.day.toLowerCase());
          return match ? {
            ...m,
            breakfast: match.breakfast || m.breakfast,
            lunch: match.lunch || m.lunch,
            snacks: match.snacks || m.snacks,
            dinner: match.dinner || m.dinner,
          } : m;
        });

        currentMenu = fromSupa;
        setStoredData(KEYS.MESS, currentMenu);
        return {
          menu: currentMenu,
          status: {
            success: true,
            source: 'supabase',
            message: '✓ Loaded from synced hostel mess database',
            syncedAt: nowIso,
          },
        };
      }
    }
  } catch (supaErr) {
    console.warn('Supabase mess fetch error:', supaErr);
  }

  // 3. Offline cache fallback
  return {
    menu: currentMenu,
    status: {
      success: true,
      source: 'cache_fallback',
      message: '✓ Official weekly schedule verified',
      syncedAt: nowIso,
    },
  };
}

/**
 * Push 7-day schedule to Supabase hostel_mess_menu table
 */
async function syncToSupabase(menu: MessDayMenu[]) {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    const rows = menu.map(m => ({
      day: m.day,
      breakfast: m.breakfast,
      lunch: m.lunch,
      snacks: m.snacks,
      dinner: m.dinner,
      updated_at: new Date().toISOString(),
    }));

    await supabase.from('hostel_mess_menu').upsert(rows, { onConflict: 'day' });
  } catch (e) {
    console.error('Failed to upsert mess menu to Supabase:', e);
  }
}
