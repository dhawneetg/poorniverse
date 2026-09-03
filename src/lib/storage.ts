import type {
  LaundryConfig,
  ClothCategory,
  ACConfig,
  AttendanceSubject,
  TodoItem,
  SGPAItem,
  MessDayMenu,
} from './types';

// Default initial state representing Poornima University / College student context
export const DEFAULT_LAUNDRY: LaundryConfig = {
  totalTokens: 60,
  usedTokens: 6,
  targetMonths: 5, // user wants to customize e.g. 5 months
  startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().split('T')[0],
  washBatchSizeThreshold: 10,
  history: [
    { id: 'l-1', date: '2026-08-10', itemsCount: 12, notes: 'College uniforms + Bedding' },
    { id: 'l-2', date: '2026-08-20', itemsCount: 9, notes: 'Casual tees + Jeans' },
    { id: 'l-3', date: '2026-08-30', itemsCount: 11, notes: 'Full batch' },
  ],
};

export const DEFAULT_CLOTHES: ClothCategory[] = [
  { id: 'c-1', name: 'Poornima Uniform Shirts', icon: '👔', cleanCount: 3, dirtyCount: 2, inLaundryCount: 0, type: 'uniform', color: 'White / Sky Blue' },
  { id: 'c-2', name: 'Uniform Trousers', icon: '👖', cleanCount: 2, dirtyCount: 1, inLaundryCount: 0, type: 'uniform', color: 'Navy Blue / Grey' },
  { id: 'c-3', name: 'Casual T-Shirts', icon: '👕', cleanCount: 6, dirtyCount: 4, inLaundryCount: 0, type: 'casual', color: 'Assorted' },
  { id: 'c-4', name: 'Jeans & Cargo Pants', icon: '👖', cleanCount: 4, dirtyCount: 1, inLaundryCount: 0, type: 'casual', color: 'Black/Blue' },
  { id: 'c-5', name: 'Lab Coat / Apron', icon: '🥼', cleanCount: 1, dirtyCount: 0, inLaundryCount: 0, type: 'lab', color: 'White' },
  { id: 'c-6', name: 'Innerwear & Socks Pairs', icon: '🧦', cleanCount: 7, dirtyCount: 3, inLaundryCount: 0, type: 'innerwear', color: 'Mixed' },
  { id: 'c-7', name: 'Bedsheets & Towels', icon: '🛏️', cleanCount: 2, dirtyCount: 1, inLaundryCount: 0, type: 'bedding', color: 'Patterned' },
];

export const DEFAULT_AC: ACConfig = {
  totalUnits: 1000,
  usedUnits: 61, // exactly 61 unit used as user mentioned
  targetMonths: 6,
  targetDailyLimit: 4.5,
  readings: [
    { id: 'ac-1', date: '2026-08-01', meterReading: 1000, consumedSinceLast: 0 },
    { id: 'ac-2', date: '2026-08-15', meterReading: 1032, consumedSinceLast: 32 },
    { id: 'ac-3', date: '2026-09-01', meterReading: 1061, consumedSinceLast: 29 },
  ],
  monthlyBudgets: {
    'August': 120,
    'September': 140,
    'October': 100,
    'November': 30,
    'December': 10,
    'January': 10,
  },
};

export const DEFAULT_ATTENDANCE: AttendanceSubject[] = [
  { id: 'sub-1', code: 'CS301', name: 'Data Structures & Algorithms', attended: 28, total: 32, type: 'Lecture', faculty: 'Dr. Sharma' },
  { id: 'sub-2', code: 'CS302', name: 'Database Management Systems', attended: 22, total: 28, type: 'Lecture', faculty: 'Prof. Verma' },
  { id: 'sub-3', code: 'CS303', name: 'Operating Systems', attended: 19, total: 27, type: 'Lecture', faculty: 'Dr. Gupta' }, // below 75%
  { id: 'sub-4', code: 'CS304', name: 'Computer Networks', attended: 26, total: 30, type: 'Lecture', faculty: 'Prof. Joshi' },
  { id: 'sub-5', code: 'CS305L', name: 'DSA Lab & Practice', attended: 11, total: 12, type: 'Lab', faculty: 'Er. Rathore' },
  { id: 'sub-6', code: 'CS306L', name: 'DBMS Lab', attended: 10, total: 10, type: 'Lab', faculty: 'Er. Choudhary' },
];

export const DEFAULT_TODOS: TodoItem[] = [
  { id: 't-1', title: 'Submit DSA Graph Assignment on LMS', category: 'Assignment', priority: 'high', dueDate: '2026-09-05', completed: false, notes: 'Problems 1 to 5 from Tutorial Sheet' },
  { id: 't-2', title: 'Complete DBMS Lab Record Experiment 4 & 5', category: 'Lab Record', priority: 'high', dueDate: '2026-09-06', completed: false, notes: 'Need signatures from faculty' },
  { id: 't-3', title: 'Give clothes to laundry (Quota check: Batch ready)', category: 'Chores', priority: 'medium', dueDate: '2026-09-04', completed: false, notes: '8 items accumulated' },
  { id: 't-4', title: 'Prepare for OS Mid-Term 1 (Process Scheduling)', category: 'Exam', priority: 'high', dueDate: '2026-09-15', completed: false, notes: 'Read Silberschatz Chapter 3 & 4' },
];

export const DEFAULT_MESS_MENU: MessDayMenu[] = [
  { day: 'Monday', breakfast: 'Aloo Paratha, Curd, Tea/Coffee', lunch: 'Rajma, Rice, Roti, Seasonal Veg, Salad', snacks: 'Veg Cutlet, Tea', dinner: 'Kadhai Paneer, Dal Fry, Roti, Gulab Jamun', rating: 4 },
  { day: 'Tuesday', breakfast: 'Poha, Jalebi, Sprouts, Milk/Tea', lunch: 'Kadi Pakora, Jeera Rice, Chapati, Aloo Jeera', snacks: 'Samosa, Green Chutney, Chai', dinner: 'Mix Veg, Dal Tadka, Roti, Rice, Kheer', rating: 3.5 },
  { day: 'Wednesday', breakfast: 'Idli Sambhar, Coconut Chutney, Tea', lunch: 'Chole, Bhature/Puri, Rice, Raita', snacks: 'Bread Pakora, Tea', dinner: 'Dum Aloo, Dal Makhani, Butter Naan/Roti, Ice Cream', rating: 4.5 },
  { day: 'Thursday', breakfast: 'Uttapam, Sambhar, Tea', lunch: 'Dal Panchmel, Baati, Churma (Rajasthani Special)', snacks: 'Patties, Cold Drink / Tea', dinner: 'Egg Curry / Shahi Paneer, Rice, Roti, Halwa', rating: 5 },
  { day: 'Friday', breakfast: 'Methi Paratha, Butter, Dahi, Tea', lunch: 'Lobia, Rice, Bhindi Masala, Chapati', snacks: 'Pasta / Chowmein, Tea', dinner: 'Matar Paneer, Dal Arhar, Jeera Rice, Rasgulla', rating: 4 },
  { day: 'Saturday', breakfast: 'Pav Bhaji / Sandwich, Tea', lunch: 'Veg Biryani, Boondi Raita, Papad, Chana Dal', snacks: 'Maggi / Sweet Corn, Coffee', dinner: 'Sev Tamatar, Yellow Dal, Chapati, Rice, Custard', rating: 4 },
  { day: 'Sunday', breakfast: 'Poori Bhaji, Halwa, Milk/Tea', lunch: 'Paneer Butter Masala, Pulao, Missi Roti', snacks: 'Biscuit / Cookies, Evening Tea', dinner: 'Special Sunday Feast & Sweet', rating: 4.8 },
];

// Helper to load and save with LocalStorage
const KEYS = {
  LAUNDRY: 'poornima_laundry_config',
  CLOTHES: 'poornima_clothes_inventory',
  AC: 'poornima_ac_config',
  ATTENDANCE: 'poornima_attendance',
  TODOS: 'poornima_todos',
  MESS: 'poornima_mess_menu',
  SETTINGS: 'poornima_app_settings',
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
