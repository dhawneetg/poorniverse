import type {
  LaundryConfig,
  ClothCategory,
  ACConfig,
  AttendanceSubject,
  TodoItem,
  SGPAItem,
  MessDayMenu,
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

export const DEFAULT_TODOS: TodoItem[] = [];

// Official Poornima Hostel Mess Menu from https://poornima.edu.in/life-at-poornima/menu-facility
export const DEFAULT_MESS_MENU: MessDayMenu[] = [
  { 
    day: 'Monday', 
    breakfast: 'Sada Paratha + Mirch Achar, Bread Butter, Tea, Hot Milk', 
    lunch: 'Aloo Chhole, Dal, Kaddu, Plain Rice, Rayta, Chapati, Achar, Salad', 
    snacks: 'Dal Kachori / Veg Sandwich, Tea', 
    dinner: 'Aloo Tamatar / Aloo Mangodi, Dal, Karela, Plain Rice, Curd, Chapati, Achar, Salad', 
    rating: 4.2 
  },
  { 
    day: 'Tuesday', 
    breakfast: 'Veg Upma / Poha + Sev Namkeen, Bread Butter, Tea, Hot Milk', 
    lunch: 'Rajma, Dal, Turai / Tinda, Rayta, Plain Rice, Chapati, Achar, Salad', 
    snacks: 'Samosa / Aloo Patties, Tea', 
    dinner: 'Shahi Paneer, Dal, Loki / Phool Gobi, Plain Rice, Curd, Chapati, Achar, Salad', 
    rating: 4.5 
  },
  { 
    day: 'Wednesday', 
    breakfast: 'Idli Sambhar + Coconut Chutney, Bread Butter, Tea, Hot Milk', 
    lunch: 'Dahi Aloo, Dal, Patta Gobi, Plain Rice, Rayta, Chapati, Achar, Salad', 
    snacks: 'Bhelpuri + Chutney / Sandwich, Tea', 
    dinner: 'Kala Chana / Paneer, Dal, Gilodi, Plain Rice, Curd, Chapati, Achar, Salad', 
    rating: 4.3 
  },
  { 
    day: 'Thursday', 
    breakfast: 'Mix Paratha, Bread Butter, Thandai, Tea', 
    lunch: 'Dal, Patta Gobi, Kala Chana, Rayta, Chapati, Salad, Achar', 
    snacks: 'Bhelpuri, Tea', 
    dinner: 'Dal, Corn Palak, Razma, Plain Rice, Chapati, Dahi, Salad', 
    rating: 4.8 
  },
  { 
    day: 'Friday', 
    breakfast: 'Pav Bhaji / Poha, Bread Butter, Tea, Hot Milk', 
    lunch: 'Besan Gatta Masala / Chana Dal, Bhindi, Plain Rice, Rayta, Chapati, Salad, Achar', 
    snacks: 'Sabudana Khichdi / Veg Pasta, Tea', 
    dinner: 'Dal, Pyaz Matar, Soyabean, Plain Rice, Curd, Chapati, Dahi, Salad', 
    rating: 4.4 
  },
  { 
    day: 'Saturday', 
    breakfast: 'Poori Aloo Bhaji, Bread Butter, Tea, Hot Milk', 
    lunch: 'Dal, Dahi Loki, Chhola, Rayta, Plain Rice, Chapati, Salad, Achar', 
    snacks: 'Dal Pakodi / Sambar Vada, Tea', 
    dinner: 'Kadhi, Patta Gobi, Chivda, Pila Pulao, Chapati, Dahi, Salad', 
    rating: 4.6 
  },
  { 
    day: 'Sunday', 
    breakfast: 'Mix Paratha / Aloo Paratha Masala, Bread Butter, Thandai, Tea', 
    lunch: 'Dal, Sukhe Aloo, Rayta, Matar Pulao, Chapati, Sevdi, Papad, Salad, Achar', 
    snacks: 'Poha, Tea', 
    dinner: 'Malai Kofta / Paneer, Dal, Plain Rice, Chapati, Dahi, Salad, Kheer / Gulab Jamun', 
    rating: 5.0 
  },
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
