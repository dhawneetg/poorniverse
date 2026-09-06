-- =============================================================
-- Poornima College Companion Suite — PostgreSQL Database Schema
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/vzbnqxevvqkkbnmojbob/sql
-- =============================================================

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  roll_number TEXT,
  department TEXT DEFAULT 'CSE',
  student_type TEXT DEFAULT 'Hosteller',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Attendance Records Table
CREATE TABLE IF NOT EXISTS public.attendance_courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  course_code TEXT NOT NULL,
  course_name TEXT NOT NULL,
  attended_classes INT DEFAULT 0,
  total_classes INT DEFAULT 0,
  course_type TEXT DEFAULT 'Lecture',
  faculty_name TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Laundry & Wardrobe Table
CREATE TABLE IF NOT EXISTS public.laundry_state (
  user_id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  total_tokens INT DEFAULT 60,
  used_tokens INT DEFAULT 0,
  target_months INT DEFAULT 5,
  wash_batch_threshold INT DEFAULT 10,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.wardrobe_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  category_type TEXT DEFAULT 'casual',
  clean_count INT DEFAULT 0,
  dirty_count INT DEFAULT 0,
  in_laundry_count INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. AC Electricity Meter Table
CREATE TABLE IF NOT EXISTS public.ac_meter_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  reading_date DATE NOT NULL DEFAULT CURRENT_DATE,
  meter_reading NUMERIC NOT NULL,
  consumed_units NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Academic Todos Table (Daily Routines & Academic Deadlines)
CREATE TABLE IF NOT EXISTS public.academic_todos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT DEFAULT 'assignment',
  priority TEXT DEFAULT 'medium',
  due_date DATE,
  is_completed BOOLEAN DEFAULT FALSE,
  is_daily BOOLEAN DEFAULT FALSE,
  is_important BOOLEAN DEFAULT FALSE,
  last_completed_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Shared Hostel Mess Schedule Table (Synced directly from Poornima Portal)
CREATE TABLE IF NOT EXISTS public.hostel_mess_menu (
  day TEXT PRIMARY KEY,
  breakfast TEXT,
  lunch TEXT,
  snacks TEXT,
  dinner TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Folder-Wise Project Tasks (Independent project / game dev tasks)
CREATE TABLE IF NOT EXISTS public.task_folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '📁',
  color TEXT DEFAULT '#0066ff',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.folder_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  folder_id UUID REFERENCES public.task_folders ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  priority TEXT DEFAULT 'medium',
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.laundry_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wardrobe_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ac_meter_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hostel_mess_menu ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folder_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow users to only access their own records
CREATE POLICY "Users can manage own profile" ON public.profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can manage own attendance" ON public.attendance_courses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own laundry" ON public.laundry_state FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own wardrobe" ON public.wardrobe_items FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own ac logs" ON public.ac_meter_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own todos" ON public.academic_todos FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own task folders" ON public.task_folders FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own folder tasks" ON public.folder_tasks FOR ALL USING (auth.uid() = user_id);

-- Mess menu is publicly viewable by all students, authenticated users can sync/update
CREATE POLICY "Public read hostel mess menu" ON public.hostel_mess_menu FOR SELECT USING (true);
CREATE POLICY "Authenticated users can update hostel mess menu" ON public.hostel_mess_menu FOR ALL USING (auth.role() = 'authenticated');
