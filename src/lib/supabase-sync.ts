import { getSupabase } from './supabase';
import type { AttendanceSubject, LaundryConfig, ClothCategory, ACConfig, TodoItem, TaskFolder, FolderTaskItem } from './types';

// Sync service to fetch and push all data to Supabase
export async function syncUserDataFromSupabase(userId: string) {
  const supabase = getSupabase();
  if (!supabase || !userId) return null;

  try {
    // 1. Fetch Attendance
    const { data: attData } = await supabase
      .from('attendance_courses')
      .select('*')
      .eq('user_id', userId);

    // 2. Fetch Laundry
    const { data: laundryData } = await supabase
      .from('laundry_state')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    // 3. Fetch Wardrobe
    const { data: wardrobeData } = await supabase
      .from('wardrobe_items')
      .select('*')
      .eq('user_id', userId);

    // 4. Fetch AC readings
    const { data: acData } = await supabase
      .from('ac_meter_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // 5. Fetch Todos
    const { data: todoData } = await supabase
      .from('academic_todos')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // 6. Fetch Task Folders & Tasks
    const { data: folderData } = await supabase
      .from('task_folders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    const { data: fTaskData } = await supabase
      .from('folder_tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return {
      attendance: attData && attData.length > 0 ? attData.map(a => ({
        id: a.id,
        code: a.course_code,
        name: a.course_name,
        attended: a.attended_classes,
        total: a.total_classes,
        type: a.course_type,
        faculty: a.faculty_name,
      })) : null,
      laundry: laundryData ? {
        totalTokens: laundryData.total_tokens || 60,
        usedTokens: laundryData.used_tokens || 0,
        targetMonths: laundryData.target_months || 5,
        washBatchSizeThreshold: laundryData.wash_batch_threshold || 10,
        history: [],
      } : null,
      wardrobe: wardrobeData && wardrobeData.length > 0 ? wardrobeData.map(w => ({
        id: w.id,
        name: w.name,
        color: w.color,
        type: w.category_type,
        cleanCount: w.clean_count,
        dirtyCount: w.dirty_count,
        inLaundryCount: w.in_laundry_count,
      })) : null,
      ac: acData && acData.length > 0 ? {
        totalUnits: 1000,
        usedUnits: Number(acData[0].consumed_units) || 0,
        readings: acData.map(r => ({
          id: r.id,
          date: r.reading_date,
          meterReading: Number(r.meter_reading),
          consumedSinceLast: Number(r.consumed_units),
        })),
      } : null,
      todos: todoData && todoData.length > 0 ? todoData.map(t => ({
        id: t.id,
        title: t.title,
        category: t.category,
        priority: t.priority,
        dueDate: t.due_date,
        completed: t.is_completed,
        isDaily: Boolean(t.is_daily),
        isImportant: Boolean(t.is_important),
        lastCompletedDate: t.last_completed_date || undefined,
      })) : null,
      taskFolders: folderData && folderData.length > 0 ? folderData.map(f => ({
        id: f.id,
        name: f.name,
        icon: f.icon || '📁',
        color: f.color || '#0066ff',
        createdAt: f.created_at,
      })) : null,
      folderTasks: fTaskData && fTaskData.length > 0 ? fTaskData.map(ft => ({
        id: ft.id,
        folderId: ft.folder_id,
        title: ft.title,
        completed: ft.is_completed,
        priority: ft.priority || 'medium',
        dueDate: ft.due_date || undefined,
        createdAt: ft.created_at,
      })) : null,
    };
  } catch (err) {
    console.error('Error syncing data from Supabase:', err);
    return null;
  }
}

// Push TCS iON / Manual Attendance to Supabase
export async function pushAttendanceToSupabase(userId: string, courses: AttendanceSubject[]) {
  const supabase = getSupabase();
  if (!supabase || !userId) return;

  try {
    // Upsert or replace courses for this user
    await supabase.from('attendance_courses').delete().eq('user_id', userId);
    
    const rows = courses.map(c => ({
      user_id: userId,
      course_code: c.code,
      course_name: c.name,
      attended_classes: c.attended,
      total_classes: c.total,
      course_type: c.type || 'Lecture',
      faculty_name: c.faculty || null,
    }));

    await supabase.from('attendance_courses').insert(rows);
  } catch (err) {
    console.error('Error saving attendance to Supabase:', err);
  }
}

// Push Laundry state to Supabase
export async function pushLaundryToSupabase(userId: string, laundry: LaundryConfig) {
  const supabase = getSupabase();
  if (!supabase || !userId) return;

  try {
    await supabase.from('laundry_state').upsert({
      user_id: userId,
      total_tokens: laundry.totalTokens,
      used_tokens: laundry.usedTokens,
      target_months: laundry.targetMonths,
      wash_batch_threshold: laundry.washBatchSizeThreshold,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error saving laundry to Supabase:', err);
  }
}

// Push Wardrobe to Supabase
export async function pushWardrobeToSupabase(userId: string, items: ClothCategory[]) {
  const supabase = getSupabase();
  if (!supabase || !userId) return;

  try {
    await supabase.from('wardrobe_items').delete().eq('user_id', userId);
    const rows = items.map(i => ({
      user_id: userId,
      name: i.name,
      color: i.color || null,
      category_type: i.type,
      clean_count: i.cleanCount,
      dirty_count: i.dirtyCount,
      in_laundry_count: i.inLaundryCount,
    }));
    await supabase.from('wardrobe_items').insert(rows);
  } catch (err) {
    console.error('Error saving wardrobe to Supabase:', err);
  }
}

// Push AC log to Supabase
export async function pushACLogToSupabase(userId: string, reading: number, date: string) {
  const supabase = getSupabase();
  if (!supabase || !userId) return;

  try {
    await supabase.from('ac_meter_logs').insert({
      user_id: userId,
      reading_date: date,
      meter_reading: 1000 + reading,
      consumed_units: reading,
    });
  } catch (err) {
    console.error('Error logging AC to Supabase:', err);
  }
}

// Push Todos to Supabase
export async function pushTodosToSupabase(userId: string, todos: TodoItem[]) {
  const supabase = getSupabase();
  if (!supabase || !userId) return;

  try {
    await supabase.from('academic_todos').delete().eq('user_id', userId);
    const rows = todos.map(t => ({
      user_id: userId,
      title: t.title,
      category: t.category,
      priority: t.priority,
      due_date: t.dueDate || null,
      is_completed: t.completed,
      is_daily: Boolean(t.isDaily),
      is_important: Boolean(t.isImportant),
      last_completed_date: t.lastCompletedDate || null,
    }));
    await supabase.from('academic_todos').insert(rows);
  } catch (err) {
    console.error('Error saving todos to Supabase:', err);
  }
}

// Push Task Folders to Supabase
export async function pushTaskFoldersToSupabase(userId: string, folders: TaskFolder[]) {
  const supabase = getSupabase();
  if (!supabase || !userId) return;

  try {
    await supabase.from('task_folders').delete().eq('user_id', userId);
    const rows = folders.map(f => ({
      id: f.id.startsWith('f-') ? undefined : f.id,
      user_id: userId,
      name: f.name,
      icon: f.icon || '📁',
      color: f.color || '#0066ff',
      created_at: f.createdAt || new Date().toISOString(),
    }));
    await supabase.from('task_folders').insert(rows);
  } catch (err) {
    console.error('Error saving task folders to Supabase:', err);
  }
}

// Push Folder Tasks to Supabase
export async function pushFolderTasksToSupabase(userId: string, tasks: FolderTaskItem[]) {
  const supabase = getSupabase();
  if (!supabase || !userId) return;

  try {
    await supabase.from('folder_tasks').delete().eq('user_id', userId);
    const rows = tasks.map(t => ({
      user_id: userId,
      folder_id: t.folderId,
      title: t.title,
      is_completed: t.completed,
      priority: t.priority || 'medium',
      due_date: t.dueDate || null,
      created_at: t.createdAt || new Date().toISOString(),
    }));
    await supabase.from('folder_tasks').insert(rows);
  } catch (err) {
    console.error('Error saving folder tasks to Supabase:', err);
  }
}

