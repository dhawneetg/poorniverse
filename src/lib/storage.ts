import type {
  LaundryConfig,
  ClothCategory,
  ACConfig,
  AttendanceSubject,
  TodoItem,
  SGPAItem,
  MessDayMenu,
  TaskFolder,
  FolderTaskItem,
} from './types';

// Clean initial state representing real Poornima student workspace (no fake records)
export const DEFAULT_LAUNDRY: LaundryConfig = {
  totalTokens: 60,
  usedTokens: 0,
  targetMonths: 5,
  startDate: new Date().toISOString().split('T')[0],
  washBatchSizeThreshold: 10,
  history: [],
};

export const DEFAULT_CLOTHES: ClothCategory[] = [
  { id: 'c-1', name: 'Poornima Uniform Shirts', icon: '👔', cleanCount: 0, dirtyCount: 0, inLaundryCount: 0, type: 'uniform', color: 'White / Sky Blue' },
  { id: 'c-2', name: 'Uniform Trousers', icon: '👖', cleanCount: 0, dirtyCount: 0, inLaundryCount: 0, type: 'uniform', color: 'Navy Blue / Grey' },
  { id: 'c-3', name: 'Casual T-Shirts', icon: '👕', cleanCount: 0, dirtyCount: 0, inLaundryCount: 0, type: 'casual', color: 'Assorted' },
  { id: 'c-4', name: 'Jeans & Pants', icon: '👖', cleanCount: 0, dirtyCount: 0, inLaundryCount: 0, type: 'casual', color: 'Black/Blue' },
  { id: 'c-5', name: 'Lab Coat / Apron', icon: '🥼', cleanCount: 0, dirtyCount: 0, inLaundryCount: 0, type: 'lab', color: 'White' },
  { id: 'c-6', name: 'Innerwear & Socks Pairs', icon: '🧦', cleanCount: 0, dirtyCount: 0, inLaundryCount: 0, type: 'innerwear', color: 'Mixed' },
  { id: 'c-7', name: 'Bedsheets & Towels', icon: '🛏️', cleanCount: 0, dirtyCount: 0, inLaundryCount: 0, type: 'bedding', color: 'Patterned' },
];

export const DEFAULT_AC: ACConfig = {
  totalUnits: 1000,
  usedUnits: 0,
  targetMonths: 6,
  targetDailyLimit: 4.5,
  readings: [],
  monthlyBudgets: {
    'August': 120,
    'September': 140,
    'October': 100,
    'November': 30,
    'December': 10,
    'January': 10,
  },
};

export const DEFAULT_ATTENDANCE: AttendanceSubject[] = [];

// Official Poornima Hostel Mess Menu from https://poornima.edu.in/life-at-poornima/menu-facility
export const DEFAULT_MESS_MENU: MessDayMenu[] = [
  { 
    day: 'Monday', 
    breakfast: 'Sada Paratha + Mirch Achar, Bread Butter, Tea, Hot Milk', 
    lunch: 'Aloo Chhole, Dal, Kaddu, Plain Rice, Rayta, Chapati, Achar, Salad', 
    snacks: 'Dal Kachori, Tea (PIET) | Veg Sandwich, Tea (PCE) | Patties, Tea (PU)', 
    dinner: 'Aloo Tamatar / Aloo Mangodi, Dal, Karela, Plain Rice, Curd, Chapati, Achar, Salad', 
    rating: 4.2 
  },
  { 
    day: 'Tuesday', 
    breakfast: 'Veg Upma / Poha + Sev Namkeen, Bread Butter, Tea, Hot Milk', 
    lunch: 'Rajma, Dal, Turai / Tinda, Rayta, Plain Rice, Chapati, Achar, Salad', 
    snacks: 'Samosa, Tea (PCE) | Aloo Patties, Tea (PU) | Bread Pakoda, Tea (PIET)', 
    dinner: 'Shahi Paneer, Dal, Loki / Phool Gobi, Plain Rice, Curd, Chapati, Achar, Salad', 
    rating: 4.5 
  },
  { 
    day: 'Wednesday', 
    breakfast: 'Idli Sambhar + Coconut Chutney, Bread Butter, Tea, Hot Milk', 
    lunch: 'Dahi Aloo, Dal, Patta Gobi, Plain Rice, Rayta, Chapati, Achar, Salad', 
    snacks: 'Bhelpuri, Tea (PU) | Veg Sandwich, Tea (PCE) | Pasta, Tea (PIET)', 
    dinner: 'Kala Chana / Paneer, Dal, Gilodi, Plain Rice, Curd, Chapati, Achar, Salad', 
    rating: 4.3 
  },
  { 
    day: 'Thursday', 
    breakfast: 'Mix Paratha, Bread Butter, Thandai, Tea', 
    lunch: 'Dal, Patta Gobi, Kala Chana, Rayta, Chapati, Salad, Achar', 
    snacks: 'Bhelpuri, Tea (PCE) | Samosa, Tea (PIET) | Patties, Cold Drink/Tea (PU)', 
    dinner: 'Dal, Corn Palak, Razma, Plain Rice, Chapati, Dahi, Salad', 
    rating: 4.8 
  },
  { 
    day: 'Friday', 
    breakfast: 'Pav Bhaji / Poha, Bread Butter, Tea, Hot Milk', 
    lunch: 'Besan Gatta Masala / Chana Dal, Bhindi, Plain Rice, Rayta, Chapati, Salad, Achar', 
    snacks: 'Sabudana Khichdi, Tea (PU) | Veg Pasta, Tea (PCE) | Bread Roll, Tea (PIET)', 
    dinner: 'Dal, Pyaz Matar, Soyabean, Plain Rice, Curd, Chapati, Dahi, Salad', 
    rating: 4.4 
  },
  { 
    day: 'Saturday', 
    breakfast: 'Poori Aloo Bhaji, Bread Butter, Tea, Hot Milk', 
    lunch: 'Dal, Dahi Loki, Chhola, Rayta, Plain Rice, Chapati, Salad, Achar', 
    snacks: 'Dal Pakodi, Tea (PCE) | Sambar Vada, Tea (PIET) | Bread Butter, Tea (PU)', 
    dinner: 'Kadhi, Patta Gobi, Chivda, Pila Pulao, Chapati, Dahi, Salad', 
    rating: 4.6 
  },
  { 
    day: 'Sunday', 
    breakfast: 'Mix Paratha / Aloo Paratha Masala, Bread Butter, Thandai, Tea', 
    lunch: 'Dal, Sukhe Aloo, Rayta, Matar Pulao, Chapati, Sevdi, Papad, Salad, Achar', 
    snacks: 'Poha, Tea (PCE, PIET) | Veg Cutlet, Tea (PU)', 
    dinner: 'Malai Kofta / Paneer, Dal, Plain Rice, Chapati, Dahi, Salad, Kheer / Gulab Jamun', 
    rating: 5.0 
  },
];

// Initial default folders for student projects (e.g. Game Dev, Side Projects)
export const DEFAULT_FOLDERS: TaskFolder[] = [
  { id: 'f-gamedev', name: 'Game Development', icon: '🎮', color: '#8b5cf6', createdAt: new Date().toISOString() },
  { id: 'f-projects', name: 'Web / App Projects', icon: '💻', color: '#0066ff', createdAt: new Date().toISOString() },
];

export const DEFAULT_FOLDER_TASKS: FolderTaskItem[] = [
  { id: 'ft-1', folderId: 'f-gamedev', title: 'Design character sprite & movement mechanics', completed: false, priority: 'high', createdAt: new Date().toISOString() },
  { id: 'ft-2', folderId: 'f-gamedev', title: 'Implement collision detection and physics loop', completed: false, priority: 'medium', createdAt: new Date().toISOString() },
  { id: 'ft-3', folderId: 'f-projects', title: 'Setup Supabase database schema and RLS policies', completed: true, priority: 'high', createdAt: new Date().toISOString() },
];

export const DEFAULT_TODOS: TodoItem[] = [
  { id: 't-daily-1', title: 'Check daily TCS iON attendance percentage', category: 'Personal', priority: 'high', dueDate: new Date().toISOString().split('T')[0], completed: false, isDaily: true, isImportant: true, createdAt: new Date().toISOString() },
  { id: 't-daily-2', title: 'Complete 1 daily DSA / coding problem', category: 'Personal', priority: 'medium', dueDate: new Date().toISOString().split('T')[0], completed: false, isDaily: true, isImportant: false, createdAt: new Date().toISOString() },
];

// Helper to load and save with LocalStorage
const KEYS = {
  LAUNDRY: 'poornima_laundry_config',
  CLOTHES: 'poornima_clothes_inventory',
  AC: 'poornima_ac_config',
  ATTENDANCE: 'poornima_attendance',
  TODOS: 'poornima_todos',
  MESS: 'poornima_mess_menu',
  COLLEGE_FILTER: 'poornima_mess_college_filter',
  SETTINGS: 'poornima_app_settings',
  TASK_FOLDERS: 'poornima_task_folders',
  FOLDER_TASKS: 'poornima_folder_tasks',
};

export function getStoredData<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.warn(`Error reading ${key} from localStorage`, e);
    return defaultValue;
  }
}

export function setStoredData<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent('poornima_data_updated', { detail: { key, value } }));
  } catch (e) {
    console.error(`Error saving ${key} to localStorage`, e);
  }
}

export { KEYS };
