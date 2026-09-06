export interface LaundryConfig {
  totalTokens: number; // default 60
  usedTokens: number; // 0..60
  targetMonths: number; // 5, 8, 10 etc
  startDate: string; // ISO date
  washBatchSizeThreshold: number; // e.g. 8 clothes
  history: Array<{
    id: string;
    date: string;
    itemsCount: number;
    notes?: string;
  }>;
}

export interface ClothCategory {
  id: string;
  name: string;
  icon: string;
  cleanCount: number;
  dirtyCount: number;
  inLaundryCount: number;
  color?: string;
  type: 'uniform' | 'casual' | 'lab' | 'bedding' | 'innerwear';
}

export interface ACConfig {
  totalUnits: number; // default 1000
  usedUnits: number; // currently 61
  targetMonths: number;
  targetDailyLimit: number;
  readings: Array<{
    id: string;
    date: string;
    meterReading: number;
    consumedSinceLast?: number;
  }>;
  monthlyBudgets: Record<string, number>; // e.g. "May": 180, "Nov": 30
}

export interface AttendanceSubject {
  id: string;
  code: string;
  name: string;
  attended: number;
  total: number;
  type?: 'Lecture' | 'Lab' | 'Tutorial';
  faculty?: string;
  lastUpdated?: string;
}

export interface TodoItem {
  id: string;
  title: string;
  category: 'Assignment' | 'Lab Record' | 'Exam' | 'Chores' | 'Personal';
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
  completed: boolean;
  notes?: string;
  isDaily?: boolean;          // Daily recurring routine
  isImportant?: boolean;      // Starred / critical
  lastCompletedDate?: string; // YYYY-MM-DD for midnight auto-reset
  createdAt?: string;
}

export interface TaskFolder {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  createdAt: string;
}

export interface FolderTaskItem {
  id: string;
  folderId: string;
  title: string;
  completed: boolean;
  priority?: 'high' | 'medium' | 'low';
  dueDate?: string;
  createdAt: string;
}


export interface SGPAItem {
  id: string;
  name: string;
  credits: number;
  mt1Marks: number; // out of 20 or 30
  mt1Max: number;
  mt2Marks: number;
  mt2Max: number;
  caMarks: number;
  caMax: number;
  targetGrade: 'O' | 'A+' | 'A' | 'B+' | 'B' | 'C';
}

export interface MessDayMenu {
  day: string;
  breakfast: string;
  lunch: string;
  snacks: string;
  dinner: string;
  specialMeal?: string;
  rating?: number;
}
