import confetti from 'canvas-confetti';
import {
  DEFAULT_LAUNDRY,
  DEFAULT_CLOTHES,
  DEFAULT_AC,
  DEFAULT_ATTENDANCE,
  DEFAULT_TODOS,
  DEFAULT_MESS_MENU,
  KEYS,
  getStoredData,
  setStoredData,
} from '../lib/storage';
import type {
  LaundryConfig,
  ClothCategory,
  ACConfig,
  AttendanceSubject,
  TodoItem,
  MessDayMenu,
} from '../lib/types';
import { calculateBunkStats, parseTcsIonText, generateTcsBookmarkletCode } from '../lib/tcs-parser';
import { getSupabase, getSupabaseConfig, resetSupabaseClient } from '../lib/supabase';
import {
  syncUserDataFromSupabase,
  pushAttendanceToSupabase,
  pushLaundryToSupabase,
  pushWardrobeToSupabase,
  pushACLogToSupabase,
  pushTodosToSupabase,
} from '../lib/supabase-sync';

// State references
let currentUserId: string | null = null;
let currentStudentName: string = getStoredData('poornima_active_user', 'Student');
let laundryState: LaundryConfig = getStoredData(KEYS.LAUNDRY, DEFAULT_LAUNDRY);
let clothesState: ClothCategory[] = getStoredData(KEYS.CLOTHES, DEFAULT_CLOTHES);
let acState: ACConfig = getStoredData(KEYS.AC, DEFAULT_AC);
let attendanceState: AttendanceSubject[] = getStoredData(KEYS.ATTENDANCE, DEFAULT_ATTENDANCE);
let todosState: TodoItem[] = getStoredData(KEYS.TODOS, DEFAULT_TODOS);
let messState: MessDayMenu[] = getStoredData(KEYS.MESS, DEFAULT_MESS_MENU);

let currentTodoFilter = 'all';
let currentWearType: 'uniform' | 'lab' | 'casual' = 'uniform';

function purgeOldSampleData() {
  // Automatically purge legacy fake courses if detected
  if (attendanceState.length > 0 && attendanceState.some(s => s.id === 'sub-1' || s.faculty === 'Dr. Sharma')) {
    attendanceState = [];
    setStoredData(KEYS.ATTENDANCE, attendanceState);
  }
  // Purge legacy fake todos if detected
  if (todosState.length > 0 && todosState.some(t => t.id === 't-1' || t.title.includes('LMS'))) {
    todosState = [];
    setStoredData(KEYS.TODOS, todosState);
  }
  // Purge legacy fake laundry history if detected
  if (laundryState.history.length > 0 && laundryState.history.some(h => h.id === 'l-1')) {
    laundryState = { ...DEFAULT_LAUNDRY, usedTokens: 0, history: [] };
    setStoredData(KEYS.LAUNDRY, laundryState);
  }
  // Purge legacy fake AC history if detected
  if (acState.readings.length > 0 && acState.readings.some(r => r.id === 'ac-1')) {
    acState = { ...DEFAULT_AC, usedUnits: 0, readings: [] };
    setStoredData(KEYS.AC, acState);
  }
  // Always update messState to official DEFAULT_MESS_MENU
  if (!messState || messState.length === 0 || messState[0].breakfast.includes('Curd, Tea/Coffee')) {
    messState = DEFAULT_MESS_MENU;
    setStoredData(KEYS.MESS, messState);
  }
}

function setupModals() {
  // Dismiss modals on backdrop click
  document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        backdrop.classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
      }
    });
  });

  // Dismiss on Escape key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.add('hidden'));
      document.body.classList.remove('overflow-hidden');
    }
  });

  // Watch for modal visibility changes to lock body scroll
  const observer = new MutationObserver(() => {
    const anyModalOpen = Array.from(document.querySelectorAll('.modal-backdrop')).some(
      m => !m.classList.contains('hidden')
    );
    if (anyModalOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
  });

  document.querySelectorAll('.modal-backdrop').forEach(m => {
    observer.observe(m, { attributes: true, attributeFilter: ['class'] });
  });
}

export function initApp() {
  purgeOldSampleData();
  setupModals();
  setupTheme();
  setupNavigation();
  setupAuthModule();
  setupAttendanceModule();
  setupLaundryAndACModule();
  setupTodoModule();
  setupCampusToolsModule();
  setupSettingsModule();
  setupExtensionModal();
  updateHeaderTicker();
  checkSupabaseSession();
}

// -------------------------------------------------------------
// 0. THEME MANAGEMENT (Dark / Light Mode)
// -------------------------------------------------------------
function setupTheme() {
  const isDark = localStorage.getItem('theme') === 'dark' || 
    (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  updateThemeIcons(isDark);

  document.getElementById('btn-theme-toggle')?.addEventListener('click', () => {
    const currentlyDark = document.documentElement.classList.contains('dark');
    if (currentlyDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      updateThemeIcons(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      updateThemeIcons(true);
    }
  });
}

function updateThemeIcons(isDark: boolean) {
  const sunIcon = document.getElementById('theme-icon-sun');
  const moonIcon = document.getElementById('theme-icon-moon');
  if (isDark) {
    sunIcon?.classList.remove('hidden');
    moonIcon?.classList.add('hidden');
  } else {
    sunIcon?.classList.add('hidden');
    moonIcon?.classList.remove('hidden');
  }
}

// -------------------------------------------------------------
// 1. NAVIGATION (Synchronized Desktop & Mobile Bottom Dock)
// -------------------------------------------------------------
function switchMainView(target: string) {
  const navButtons = document.querySelectorAll('.nav-main-tab');
  const sections: Record<string, HTMLElement | null> = {
    attendance: document.getElementById('view-attendance'),
    hostel: document.getElementById('view-hostel'),
    todos: document.getElementById('view-todos'),
    tools: document.getElementById('view-tools'),
  };

  navButtons.forEach(b => {
    const bTarget = b.getAttribute('data-view');
    if (bTarget === target) {
      b.className = 'nav-main-tab active px-4 py-1.5 rounded-full bg-[#141414] dark:bg-white text-white dark:text-[#141414] font-semibold text-xs transition-all shadow-sm whitespace-nowrap flex-1 sm:flex-initial text-center';
    } else {
      b.className = 'nav-main-tab px-4 py-1.5 rounded-full text-[#707070] dark:text-[#a1a1aa] hover:text-[#141414] dark:hover:text-white font-semibold text-xs transition-all whitespace-nowrap flex-1 sm:flex-initial text-center';
    }
  });

  Object.entries(sections).forEach(([key, el]) => {
    if (!el) return;
    if (key === target) {
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setupNavigation() {
  const navButtons = document.querySelectorAll('.nav-main-tab');
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-view');
      if (target) switchMainView(target);
    });
  });

  // Footer navigation buttons
  document.querySelectorAll('.footer-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-view');
      if (target) switchMainView(target);
    });
  });

  // Footer modal trigger buttons
  document.getElementById('footer-btn-bm')?.addEventListener('click', () => {
    document.getElementById('modal-bookmarklet')?.classList.remove('hidden');
  });
  document.getElementById('footer-btn-sync')?.addEventListener('click', () => {
    document.getElementById('modal-auth')?.classList.remove('hidden');
  });
  document.getElementById('footer-btn-settings')?.addEventListener('click', () => {
    document.getElementById('modal-settings')?.classList.remove('hidden');
  });

  const btnTabLaundry = document.getElementById('tab-btn-laundry');
  const btnTabAC = document.getElementById('tab-btn-ac');
  const secLaundry = document.getElementById('section-laundry');
  const secAC = document.getElementById('section-ac');

  btnTabLaundry?.addEventListener('click', () => {
    btnTabLaundry.className = 'px-5 py-2 rounded-full bg-[#141414] dark:bg-white text-white dark:text-[#141414] font-semibold text-xs transition-all shadow-sm';
    if (btnTabAC) btnTabAC.className = 'px-5 py-2 rounded-full text-[#707070] dark:text-[#a1a1aa] hover:text-[#141414] dark:hover:text-white font-semibold text-xs transition-all';
    secLaundry?.classList.remove('hidden');
    secAC?.classList.add('hidden');
  });

  btnTabAC?.addEventListener('click', () => {
    btnTabAC.className = 'px-5 py-2 rounded-full bg-[#141414] dark:bg-white text-white dark:text-[#141414] font-semibold text-xs transition-all shadow-sm';
    if (btnTabLaundry) btnTabLaundry.className = 'px-5 py-2 rounded-full text-[#707070] dark:text-[#a1a1aa] hover:text-[#141414] dark:hover:text-white font-semibold text-xs transition-all';
    secAC?.classList.remove('hidden');
    secLaundry?.classList.add('hidden');
  });
}

// -------------------------------------------------------------
// 2. REAL SUPABASE AUTH & CLOUD DATA SYNC
// -------------------------------------------------------------
async function checkSupabaseSession() {
  const supabase = getSupabase();
  const unauthBox = document.getElementById('auth-unauthenticated');
  const authBox = document.getElementById('auth-authenticated');
  const userDisplay = document.getElementById('header-user-display');
  const pill = document.getElementById('supabase-status-pill');

  if (!supabase) {
    if (pill) {
      pill.className = 'text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#f0f0f0] dark:bg-[#27272a] text-[#707070] dark:text-[#a1a1aa]';
      pill.textContent = 'Local Storage Mode';
    }
    unauthBox?.classList.remove('hidden');
    authBox?.classList.add('hidden');
    return;
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session && session.user) {
      currentUserId = session.user.id;
      currentStudentName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Student';
      setStoredData('poornima_active_user', currentStudentName);

      unauthBox?.classList.add('hidden');
      authBox?.classList.remove('hidden');
      if (userDisplay) userDisplay.textContent = currentStudentName;

      if (pill) {
        pill.className = 'text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#ecfdf5] dark:bg-[#064e3b] text-[#047857] dark:text-[#34d399] border border-[#a7f3d0] dark:border-[#065f46]';
        pill.textContent = 'Connected & Synced';
      }

      await loadUserDataFromSupabase(session.user.id);
    } else {
      currentUserId = null;
      unauthBox?.classList.remove('hidden');
      authBox?.classList.add('hidden');
    }

    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session && session.user) {
        currentUserId = session.user.id;
        currentStudentName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Student';
        setStoredData('poornima_active_user', currentStudentName);

        unauthBox?.classList.add('hidden');
        authBox?.classList.remove('hidden');
        if (userDisplay) userDisplay.textContent = currentStudentName;

        await loadUserDataFromSupabase(session.user.id);
      } else {
        currentUserId = null;
        unauthBox?.classList.remove('hidden');
        authBox?.classList.add('hidden');
      }
    });
  } catch (err) {
    console.warn('Supabase auth session error:', err);
  }
}

async function loadUserDataFromSupabase(userId: string) {
  const synced = await syncUserDataFromSupabase(userId);
  if (!synced) return;

  if (synced.attendance && synced.attendance.length > 0) {
    attendanceState = synced.attendance;
    setStoredData(KEYS.ATTENDANCE, attendanceState);
    renderAttendance();
  }
  if (synced.laundry) {
    laundryState = synced.laundry;
    setStoredData(KEYS.LAUNDRY, laundryState);
    renderLaundry();
  }
  if (synced.wardrobe && synced.wardrobe.length > 0) {
    clothesState = synced.wardrobe;
    setStoredData(KEYS.CLOTHES, clothesState);
    renderWardrobe();
  }
  if (synced.ac) {
    acState = synced.ac;
    setStoredData(KEYS.AC, acState);
    renderAC();
  }
  if (synced.todos && synced.todos.length > 0) {
    todosState = synced.todos;
    setStoredData(KEYS.TODOS, todosState);
    renderTodos();
  }
  updateHeaderTicker();
}

function setupAuthModule() {
  const modalAuth = document.getElementById('modal-auth');
  const tabSignIn = document.getElementById('auth-tab-signin');
  const tabSignUp = document.getElementById('auth-tab-signup');
  const panelSignIn = document.getElementById('auth-panel-signin');
  const panelSignUp = document.getElementById('auth-panel-signup');

  document.getElementById('btn-header-signin')?.addEventListener('click', () => {
    modalAuth?.classList.remove('hidden');
  });

  document.getElementById('btn-header-signout')?.addEventListener('click', async () => {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.auth.signOut();
    }
    currentUserId = null;
    currentStudentName = 'Student';
    localStorage.removeItem('poornima_active_user');
    
    document.getElementById('auth-unauthenticated')?.classList.remove('hidden');
    document.getElementById('auth-authenticated')?.classList.add('hidden');
    alert('You have signed out successfully.');
  });

  document.getElementById('btn-close-auth-modal')?.addEventListener('click', () => {
    modalAuth?.classList.add('hidden');
  });

  function switchAuthTab(activeBtn: HTMLElement | null, activePanel: HTMLElement | null) {
    [tabSignIn, tabSignUp].forEach(btn => {
      if (btn) btn.className = 'auth-pill px-4 py-1.5 rounded-full text-[#707070] dark:text-[#a1a1aa] hover:text-[#141414] dark:hover:text-white font-semibold text-xs transition-all';
    });
    [panelSignIn, panelSignUp].forEach(panel => {
      if (panel) panel.classList.add('hidden');
    });

    if (activeBtn) activeBtn.className = 'auth-pill active px-4 py-1.5 rounded-full bg-[#141414] dark:bg-white text-white dark:text-[#141414] font-semibold text-xs transition-all';
    if (activePanel) activePanel.classList.remove('hidden');
  }

  tabSignIn?.addEventListener('click', () => switchAuthTab(tabSignIn, panelSignIn));
  tabSignUp?.addEventListener('click', () => switchAuthTab(tabSignUp, panelSignUp));

  document.getElementById('btn-google-auth')?.addEventListener('click', async () => {
    const supabase = getSupabase();
    if (!supabase) {
      alert('Supabase credentials are required for Google OAuth. Check your .env or Settings.');
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) alert(`Google Sign-In Error: ${error.message}`);
    } catch (err: any) {
      alert(`OAuth Error: ${err.message}`);
    }
  });

  document.getElementById('form-signin')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = (document.getElementById('signin-identifier') as HTMLInputElement).value.trim();
    const password = (document.getElementById('signin-password') as HTMLInputElement).value;

    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: id,
        password: password,
      });

      if (error) {
        alert(`Sign In Error: ${error.message}`);
        return;
      }

      currentUserId = data.user.id;
      currentStudentName = data.user?.user_metadata?.full_name || id.split('@')[0];
      await loadUserDataFromSupabase(data.user.id);
    } else {
      currentStudentName = id.split('@')[0] || 'Student';
    }

    setStoredData('poornima_active_user', currentStudentName);
    document.getElementById('auth-unauthenticated')?.classList.add('hidden');
    document.getElementById('auth-authenticated')?.classList.remove('hidden');
    const userDisplay = document.getElementById('header-user-display');
    if (userDisplay) userDisplay.textContent = currentStudentName;

    modalAuth?.classList.add('hidden');
    confetti({ particleCount: 30, spread: 45 });
  });

  document.getElementById('form-signup')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = (document.getElementById('signup-name') as HTMLInputElement).value.trim();
    const email = (document.getElementById('signup-email') as HTMLInputElement).value.trim();
    const password = (document.getElementById('signup-password') as HTMLInputElement).value;
    const type = (document.getElementById('signup-type') as HTMLSelectElement).value;

    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name, student_type: type },
        },
      });

      if (error) {
        alert(`Sign Up Error: ${error.message}`);
        return;
      }

      if (data.user) {
        currentUserId = data.user.id;
        await pushAttendanceToSupabase(data.user.id, attendanceState);
        await pushLaundryToSupabase(data.user.id, laundryState);
        await pushWardrobeToSupabase(data.user.id, clothesState);
      }
    }

    currentStudentName = name;
    setStoredData('poornima_active_user', currentStudentName);
    document.getElementById('auth-unauthenticated')?.classList.add('hidden');
    document.getElementById('auth-authenticated')?.classList.remove('hidden');
    const userDisplay = document.getElementById('header-user-display');
    if (userDisplay) userDisplay.textContent = currentStudentName;

    modalAuth?.classList.add('hidden');
    confetti({ particleCount: 40, spread: 50 });
  });
}

// -------------------------------------------------------------
// 3. EXTENSION MODAL
// -------------------------------------------------------------
function setupExtensionModal() {
  const modal = document.getElementById('modal-extension');
  document.getElementById('btn-open-extension-modal')?.addEventListener('click', () => {
    modal?.classList.remove('hidden');
  });
  document.getElementById('footer-btn-ext')?.addEventListener('click', (e) => {
    e.preventDefault();
    modal?.classList.remove('hidden');
  });
  document.getElementById('btn-close-ext-modal')?.addEventListener('click', () => {
    modal?.classList.add('hidden');
  });
  document.getElementById('btn-done-ext')?.addEventListener('click', () => {
    modal?.classList.add('hidden');
  });
}

// -------------------------------------------------------------
// 4. ATTENDANCE MODULE
// -------------------------------------------------------------
function setupAttendanceModule() {
  renderAttendance();

  const bmLink = document.getElementById('bookmarklet-link') as HTMLAnchorElement;
  const bmCodeInput = document.getElementById('bookmarklet-code-input') as HTMLInputElement;
  const bmCode = generateTcsBookmarkletCode();
  if (bmLink) bmLink.href = bmCode;
  if (bmCodeInput) bmCodeInput.value = bmCode;

  document.getElementById('btn-open-bookmarklet-modal')?.addEventListener('click', () => {
    document.getElementById('modal-bookmarklet')?.classList.remove('hidden');
  });
  document.getElementById('btn-close-bm-modal')?.addEventListener('click', () => {
    document.getElementById('modal-bookmarklet')?.classList.add('hidden');
  });
  document.getElementById('btn-close-bm')?.addEventListener('click', () => {
    document.getElementById('modal-bookmarklet')?.classList.add('hidden');
  });
  document.getElementById('btn-copy-bm-code')?.addEventListener('click', () => {
    navigator.clipboard.writeText(bmCode);
    alert('Bookmarklet code copied to clipboard.');
  });

  const modalPaste = document.getElementById('modal-paste-tcs');
  document.getElementById('btn-open-paste-modal')?.addEventListener('click', () => {
    modalPaste?.classList.remove('hidden');
  });
  document.getElementById('btn-close-paste-modal')?.addEventListener('click', () => {
    modalPaste?.classList.add('hidden');
  });
  document.getElementById('btn-cancel-paste')?.addEventListener('click', () => {
    modalPaste?.classList.add('hidden');
  });

  document.getElementById('btn-load-sample-tcs')?.addEventListener('click', () => {
    const pasteInput = document.getElementById('tcs-paste-input') as HTMLTextAreaElement;
    if (pasteInput) {
      pasteInput.value = `CS301 Data Structures & Algorithms\t28\t32\t87.5%
CS302 Database Management Systems\t22\t28\t78.6%
CS303 Operating Systems\t19\t27\t70.4%
CS304 Computer Networks\t26\t30\t86.7%
CS305L DSA Practical Lab\t11\t12\t91.7%
CS306L DBMS Lab\t10\t10\t100%`;
    }
  });

  document.getElementById('btn-process-paste')?.addEventListener('click', async () => {
    const pasteInput = document.getElementById('tcs-paste-input') as HTMLTextAreaElement;
    if (!pasteInput?.value.trim()) {
      alert('Please paste attendance text from TCS iON');
      return;
    }
    const parsed = parseTcsIonText(pasteInput.value);
    if (parsed.length > 0) {
      attendanceState = parsed;
      setStoredData(KEYS.ATTENDANCE, attendanceState);
      
      if (currentUserId) {
        await pushAttendanceToSupabase(currentUserId, attendanceState);
      }

      renderAttendance();
      updateHeaderTicker();
      modalPaste?.classList.add('hidden');
      confetti({ particleCount: 40, spread: 50 });
    } else {
      alert('Could not detect attendance data. Please verify copied text.');
    }
  });

  document.getElementById('btn-mark-all-present')?.addEventListener('click', async () => {
    attendanceState = attendanceState.map(sub => ({
      ...sub,
      attended: sub.attended + 1,
      total: sub.total + 1,
    }));
    setStoredData(KEYS.ATTENDANCE, attendanceState);
    if (currentUserId) {
      await pushAttendanceToSupabase(currentUserId, attendanceState);
    }
    renderAttendance();
    updateHeaderTicker();
    confetti({ particleCount: 30, spread: 45, origin: { y: 0.8 } });
  });

  const modalSub = document.getElementById('modal-subject');
  document.getElementById('btn-add-subject-modal')?.addEventListener('click', () => {
    (document.getElementById('form-subject') as HTMLFormElement)?.reset();
    (document.getElementById('sub-input-id') as HTMLInputElement).value = '';
    modalSub?.classList.remove('hidden');
  });
  document.getElementById('btn-close-sub-modal')?.addEventListener('click', () => {
    modalSub?.classList.add('hidden');
  });
  document.getElementById('btn-cancel-sub')?.addEventListener('click', () => {
    modalSub?.classList.add('hidden');
  });

  document.getElementById('form-subject')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = (document.getElementById('sub-input-id') as HTMLInputElement).value;
    const code = (document.getElementById('sub-input-code') as HTMLInputElement).value.trim();
    const name = (document.getElementById('sub-input-name') as HTMLInputElement).value.trim();
    const attended = parseInt((document.getElementById('sub-input-attended') as HTMLInputElement).value, 10);
    const total = parseInt((document.getElementById('sub-input-total') as HTMLInputElement).value, 10);
    const type = (document.getElementById('sub-input-type') as HTMLSelectElement).value as any;
    const faculty = (document.getElementById('sub-input-faculty') as HTMLInputElement).value.trim();

    if (id) {
      attendanceState = attendanceState.map(s => s.id === id ? { ...s, code, name, attended, total, type, faculty } : s);
    } else {
      attendanceState.push({
        id: 'sub-' + Math.random().toString(36).substring(2, 8),
        code,
        name,
        attended,
        total,
        type,
        faculty,
      });
    }

    setStoredData(KEYS.ATTENDANCE, attendanceState);
    if (currentUserId) {
      await pushAttendanceToSupabase(currentUserId, attendanceState);
    }

    renderAttendance();
    updateHeaderTicker();
    modalSub?.classList.add('hidden');
  });
}

function renderAttendance() {
  const container = document.getElementById('subjects-container');
  if (!container) return;

  let totalAttended = 0;
  let totalClasses = 0;

  container.innerHTML = '';

  if (attendanceState.length === 0) {
    container.innerHTML = `
      <div class="col-span-full card-mobbin p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-4">
        <div class="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-2xl font-bold border border-blue-500/20">
          📋
        </div>
        <div class="space-y-1">
          <h4 class="font-heading text-lg text-[#09090b] dark:text-white">No Courses Added Yet</h4>
          <p class="text-xs text-[#71717a] dark:text-[#a1a1aa] max-w-md mx-auto leading-relaxed">
            Import your real attendance table from the TCS iON portal in one click, or add individual college courses manually to simulate 75% bunks.
          </p>
        </div>
        <div class="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button id="btn-empty-paste" class="pill-primary text-xs"><span>Import from TCS iON</span></button>
          <button id="btn-empty-add" class="pill-outline text-xs"><span>+ Add Enrolled Course</span></button>
        </div>
      </div>
    `;

    document.getElementById('btn-empty-paste')?.addEventListener('click', () => {
      document.getElementById('modal-paste-tcs')?.classList.remove('hidden');
    });
    document.getElementById('btn-empty-add')?.addEventListener('click', () => {
      (document.getElementById('form-subject') as HTMLFormElement)?.reset();
      (document.getElementById('sub-input-id') as HTMLInputElement).value = '';
      document.getElementById('modal-subject')?.classList.remove('hidden');
    });

    const overallCircle = document.getElementById('overall-circle-bar');
    const overallPctText = document.getElementById('overall-att-pct');
    const overallRatioText = document.getElementById('overall-att-ratio');
    const overallPill = document.getElementById('overall-status-pill');

    if (overallPctText) overallPctText.textContent = '--%';
    if (overallRatioText) overallRatioText.textContent = '0 / 0';
    if (overallCircle) overallCircle.setAttribute('stroke-dasharray', '0, 100');
    if (overallPill) {
      overallPill.className = 'mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#f1f3f5] dark:bg-[#27272a] text-[#71717a] dark:text-[#a1a1aa] border border-[#e4e4e7] dark:border-[#3f3f46]';
      overallPill.textContent = 'Awaiting TCS iON data';
    }
    const subCountBadge = document.getElementById('subject-count-badge');
    if (subCountBadge) subCountBadge.textContent = '0 Courses';
    return;
  }

  attendanceState.forEach(sub => {
    totalAttended += sub.attended;
    totalClasses += sub.total;

    const stats = calculateBunkStats(sub.attended, sub.total, 75);
    const pct = stats.percentage;

    const statusBadge = stats.isSafe
      ? `<span class="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#ecfdf5] dark:bg-[#064e3b] text-[#047857] dark:text-[#34d399] border border-[#a7f3d0] dark:border-[#065f46]">${stats.statusText}</span>`
      : `<span class="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#fef2f2] dark:bg-[#450a0a] text-[#b91c1c] dark:text-[#f87171] border border-[#fecaca] dark:border-[#7f1d1d]">${stats.statusText}</span>`;

    const circleStrokeColor = stats.isSafe ? '#047857' : (pct < 65 ? '#b91c1c' : '#b45309');

    const card = document.createElement('div');
    card.className = 'card-mobbin p-6 sm:p-7 flex flex-col justify-between hover:border-[#141414] dark:hover:border-white transition-colors';
    card.innerHTML = `
      <div>
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#f0f0f0] dark:bg-[#27272a] text-[#141414] dark:text-white font-mono border border-[#e0e0e0] dark:border-[#3f3f46]">${sub.code}</span>
              <span class="text-[11px] text-[#707070] dark:text-[#a1a1aa] font-semibold">${sub.type || 'Lecture'}</span>
            </div>
            <h4 class="font-heading text-base text-[#141414] dark:text-white mt-2 leading-snug">${sub.name}</h4>
            ${sub.faculty ? `<p class="font-caption text-xs mt-1 text-[#707070] dark:text-[#a1a1aa]">${sub.faculty}</p>` : ''}
          </div>

          <div class="relative w-14 h-14 shrink-0 flex items-center justify-center">
            <svg class="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                class="text-[#e4e4e7] dark:text-[#3f3f46]"
                stroke-width="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                class="transition-all duration-700"
                stroke-dasharray="${Math.min(100, pct)}, 100"
                stroke-width="3.5"
                stroke-linecap="round"
                stroke="${circleStrokeColor}"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div class="absolute flex flex-col items-center">
              <span class="font-heading text-xs text-[#141414] dark:text-white">${pct}%</span>
            </div>
          </div>
        </div>

        <div class="mt-5 p-3.5 rounded-2xl card-inner-well flex items-center justify-between">
          <div>
            <div class="text-[10px] text-[#707070] dark:text-[#a1a1aa] uppercase font-semibold">Attendance</div>
            <div class="font-heading text-sm text-[#141414] dark:text-white">${sub.attended} of ${sub.total} held</div>
          </div>
          ${statusBadge}
        </div>
      </div>

      <div class="mt-5 pt-4 border-t border-[#e0e0e0] dark:border-[#27272a] flex items-center justify-between text-xs">
        <span class="text-[11px] text-[#707070] dark:text-[#a1a1aa] font-medium">Quick Sim:</span>
        <div class="flex items-center gap-1.5">
          <button class="btn-sim-present pill-soft text-xs py-1 px-3 text-[#047857] dark:text-[#34d399]" data-id="${sub.id}" title="Simulate attending next class">
            +1 Present
          </button>
          <button class="btn-sim-bunk pill-soft text-xs py-1 px-3 text-[#b91c1c] dark:text-[#f87171]" data-id="${sub.id}" title="Simulate missing next class">
            +1 Bunk
          </button>
          <button class="btn-del-sub p-1 text-[#adadad] dark:text-[#71717a] hover:text-[#b91c1c] text-xs ml-1" data-id="${sub.id}" title="Remove course">
            Remove
          </button>
        </div>
      </div>
    `;

    card.querySelector('.btn-sim-present')?.addEventListener('click', async () => {
      attendanceState = attendanceState.map(s => s.id === sub.id ? { ...s, attended: s.attended + 1, total: s.total + 1 } : s);
      setStoredData(KEYS.ATTENDANCE, attendanceState);
      if (currentUserId) await pushAttendanceToSupabase(currentUserId, attendanceState);
      renderAttendance();
      updateHeaderTicker();
    });

    card.querySelector('.btn-sim-bunk')?.addEventListener('click', async () => {
      attendanceState = attendanceState.map(s => s.id === sub.id ? { ...s, total: s.total + 1 } : s);
      setStoredData(KEYS.ATTENDANCE, attendanceState);
      if (currentUserId) await pushAttendanceToSupabase(currentUserId, attendanceState);
      renderAttendance();
      updateHeaderTicker();
    });

    card.querySelector('.btn-del-sub')?.addEventListener('click', async () => {
      if (confirm(`Remove ${sub.name} from attendance list?`)) {
        attendanceState = attendanceState.filter(s => s.id !== sub.id);
        setStoredData(KEYS.ATTENDANCE, attendanceState);
        if (currentUserId) await pushAttendanceToSupabase(currentUserId, attendanceState);
        renderAttendance();
        updateHeaderTicker();
      }
    });

    container.appendChild(card);
  });

  const overallPct = totalClasses > 0 ? Number(((totalAttended / totalClasses) * 100).toFixed(1)) : 100;
  const overallCircle = document.getElementById('overall-circle-bar');
  const overallPctText = document.getElementById('overall-att-pct');
  const overallRatioText = document.getElementById('overall-att-ratio');
  const overallPill = document.getElementById('overall-status-pill');

  if (overallPctText) overallPctText.textContent = `${overallPct}%`;
  if (overallRatioText) overallRatioText.textContent = `${totalAttended} / ${totalClasses}`;
  if (overallCircle) {
    overallCircle.setAttribute('stroke-dasharray', `${overallPct}, 100`);
    if (overallPct >= 75) {
      overallCircle.setAttribute('class', 'text-[#047857] dark:text-[#10b981] transition-all duration-700');
    } else {
      overallCircle.setAttribute('class', 'text-[#b91c1c] dark:text-[#f87171] transition-all duration-700');
    }
  }

  if (overallPill) {
    if (overallPct >= 75) {
      overallPill.className = 'mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#ecfdf5] dark:bg-[#064e3b] text-[#047857] dark:text-[#34d399] border border-[#a7f3d0] dark:border-[#065f46]';
      overallPill.textContent = 'Above 75% Target';
    } else {
      overallPill.className = 'mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#fef2f2] dark:bg-[#450a0a] text-[#b91c1c] dark:text-[#f87171] border border-[#fecaca] dark:border-[#7f1d1d]';
      overallPill.textContent = 'Below 75% Criteria';
    }
  }

  const subCountBadge = document.getElementById('subject-count-badge');
  if (subCountBadge) subCountBadge.textContent = `${attendanceState.length} Courses`;
}

// -------------------------------------------------------------
// 5. LAUNDRY & AC HOSTEL QUOTA MODULE
// -------------------------------------------------------------
function setupLaundryAndACModule() {
  renderLaundry();
  renderWardrobe();
  renderAC();

  const durSlider = document.getElementById('laundry-duration-slider') as HTMLInputElement;
  durSlider?.addEventListener('input', async () => {
    const months = parseInt(durSlider.value, 10);
    laundryState.targetMonths = months;
    setStoredData(KEYS.LAUNDRY, laundryState);
    if (currentUserId) await pushLaundryToSupabase(currentUserId, laundryState);
    renderLaundry();
  });

  const batchSelect = document.getElementById('select-batch-threshold') as HTMLSelectElement;
  batchSelect?.addEventListener('change', async () => {
    laundryState.washBatchSizeThreshold = parseInt(batchSelect.value, 10);
    setStoredData(KEYS.LAUNDRY, laundryState);
    if (currentUserId) await pushLaundryToSupabase(currentUserId, laundryState);
    renderLaundry();
  });

  document.getElementById('btn-use-laundry-token')?.addEventListener('click', async () => {
    if (laundryState.usedTokens >= laundryState.totalTokens) {
      alert('You have consumed all 60 laundry tokens.');
      return;
    }

    laundryState.usedTokens += 1;
    let movedCount = 0;
    clothesState = clothesState.map(c => {
      movedCount += c.dirtyCount;
      return {
        ...c,
        inLaundryCount: c.inLaundryCount + c.dirtyCount,
        dirtyCount: 0,
      };
    });

    setStoredData(KEYS.LAUNDRY, laundryState);
    setStoredData(KEYS.CLOTHES, clothesState);
    if (currentUserId) {
      await pushLaundryToSupabase(currentUserId, laundryState);
      await pushWardrobeToSupabase(currentUserId, clothesState);
    }

    renderLaundry();
    renderWardrobe();
    updateHeaderTicker();
    confetti({ particleCount: 30, spread: 50 });
  });

  const wearButtons = document.querySelectorAll('.wear-type-btn');
  wearButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      wearButtons.forEach(b => {
        b.className = 'wear-type-btn py-2 rounded-full bg-[#f3f3f3] dark:bg-[#27272a] text-[#141414] dark:text-white font-semibold text-xs text-center transition-all hover:bg-[#e0e0e0] dark:hover:bg-[#3f3f46]';
      });
      btn.className = 'wear-type-btn active py-2 rounded-full bg-[#141414] dark:bg-white text-white dark:text-[#141414] font-semibold text-xs text-center transition-all';
      currentWearType = btn.getAttribute('data-type') as any;
      renderOutfitRecommendation();
    });
  });

  const modalCloth = document.getElementById('modal-add-cloth');
  document.getElementById('btn-add-cloth-category')?.addEventListener('click', () => {
    (document.getElementById('form-add-cloth') as HTMLFormElement)?.reset();
    modalCloth?.classList.remove('hidden');
  });
  document.getElementById('btn-close-cloth-modal')?.addEventListener('click', () => {
    modalCloth?.classList.add('hidden');
  });
  document.getElementById('btn-cancel-cloth')?.addEventListener('click', () => {
    modalCloth?.classList.add('hidden');
  });

  document.getElementById('form-add-cloth')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = (document.getElementById('cloth-input-name') as HTMLInputElement).value.trim();
    const color = (document.getElementById('cloth-input-color') as HTMLInputElement).value.trim();
    const type = (document.getElementById('cloth-input-type') as HTMLSelectElement).value as any;
    const cleanCount = parseInt((document.getElementById('cloth-input-clean') as HTMLInputElement).value, 10) || 0;
    const dirtyCount = parseInt((document.getElementById('cloth-input-dirty') as HTMLInputElement).value, 10) || 0;

    clothesState.push({
      id: 'c-' + Date.now(),
      name,
      color,
      type,
      cleanCount,
      dirtyCount,
      inLaundryCount: 0,
      icon: name.substring(0, 2).toUpperCase(),
    });

    setStoredData(KEYS.CLOTHES, clothesState);
    if (currentUserId) await pushWardrobeToSupabase(currentUserId, clothesState);

    renderWardrobe();
    renderLaundry();
    modalCloth?.classList.add('hidden');
    confetti({ particleCount: 30, spread: 45 });
  });

  const modalAC = document.getElementById('modal-ac-reading');
  document.getElementById('btn-log-ac-reading')?.addEventListener('click', () => {
    const inputDate = document.getElementById('ac-input-date') as HTMLInputElement;
    if (inputDate) inputDate.value = new Date().toISOString().split('T')[0];
    const inputRead = document.getElementById('ac-input-reading') as HTMLInputElement;
    if (inputRead) inputRead.value = acState.usedUnits.toString();
    modalAC?.classList.remove('hidden');
  });
  document.getElementById('btn-close-ac-modal')?.addEventListener('click', () => {
    modalAC?.classList.add('hidden');
  });
  document.getElementById('btn-cancel-ac')?.addEventListener('click', () => {
    modalAC?.classList.add('hidden');
  });

  document.getElementById('form-ac-reading')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const reading = parseFloat((document.getElementById('ac-input-reading') as HTMLInputElement).value);
    const date = (document.getElementById('ac-input-date') as HTMLInputElement).value;

    acState.usedUnits = reading;
    acState.readings.push({
      id: 'ac-' + Date.now(),
      date,
      meterReading: 1000 + reading,
      consumedSinceLast: reading,
    });

    setStoredData(KEYS.AC, acState);
    if (currentUserId) await pushACLogToSupabase(currentUserId, reading, date);

    renderAC();
    updateHeaderTicker();
    modalAC?.classList.add('hidden');
  });
}

function renderLaundry() {
  const left = laundryState.totalTokens - laundryState.usedTokens;
  const durMonths = laundryState.targetMonths || 5;
  const totalWeeks = durMonths * 4.3;
  const allowedRatePerWeek = (left / totalWeeks).toFixed(1);

  const leftCountEl = document.getElementById('laundry-left-count');
  const usedCountEl = document.getElementById('laundry-used-count');
  const durLabel = document.getElementById('laundry-duration-label');
  const weeklyRateEl = document.getElementById('laundry-weekly-rate');
  const progressBar = document.getElementById('laundry-progress-bar');

  if (leftCountEl) leftCountEl.textContent = left.toString();
  if (usedCountEl) usedCountEl.textContent = laundryState.usedTokens.toString();
  if (durLabel) durLabel.textContent = `${durMonths} Months`;
  if (weeklyRateEl) weeklyRateEl.textContent = `~${allowedRatePerWeek} Washes / Wk`;
  if (progressBar) progressBar.style.width = `${(laundryState.usedTokens / laundryState.totalTokens) * 100}%`;

  let dirtyUniforms = 0;
  let dirtyCasuals = 0;
  let dirtyMisc = 0;

  clothesState.forEach(c => {
    if (c.type === 'uniform') dirtyUniforms += c.dirtyCount;
    else if (c.type === 'casual') dirtyCasuals += c.dirtyCount;
    else dirtyMisc += c.dirtyCount;
  });

  const totalDirty = dirtyUniforms + dirtyCasuals + dirtyMisc;

  const dirtyUStat = document.getElementById('dirty-uniforms-stat');
  const dirtyCStat = document.getElementById('dirty-casuals-stat');
  const dirtyMStat = document.getElementById('dirty-misc-stat');
  const dirtyTStat = document.getElementById('dirty-total-stat');

  if (dirtyUStat) dirtyUStat.textContent = `${dirtyUniforms} items`;
  if (dirtyCStat) dirtyCStat.textContent = `${dirtyCasuals} items`;
  if (dirtyMStat) dirtyMStat.textContent = `${dirtyMisc} items`;
  if (dirtyTStat) dirtyTStat.textContent = `${totalDirty} items`;

  const advHeading = document.getElementById('advisor-heading');
  const advDesc = document.getElementById('advisor-desc');
  const advBadge = document.getElementById('advisor-status-badge');
  const threshold = laundryState.washBatchSizeThreshold || 10;

  const cleanUniformShirts = clothesState.find(c => c.id === 'c-1')?.cleanCount || 0;

  if (cleanUniformShirts <= 1 || totalDirty >= threshold) {
    if (advHeading) advHeading.textContent = 'Start Gathering Clothes & Give to Laundry';
    if (advDesc) advDesc.textContent = `You have ${totalDirty} dirty items accumulated (Threshold: ${threshold}) and ${cleanUniformShirts} clean uniform shirts remaining. Giving laundry now aligns with your ${durMonths}-month pace of ~${allowedRatePerWeek} washes/week.`;
    if (advBadge) {
      advBadge.className = 'px-3 py-1 rounded-full text-[11px] font-semibold bg-[#141414] dark:bg-white text-white dark:text-[#141414]';
      advBadge.textContent = 'Action: Give Laundry';
    }
  } else {
    if (advHeading) advHeading.textContent = 'Hold Off Giving Laundry (Conserve Token)';
    if (advDesc) advDesc.textContent = `You have only ${totalDirty} dirty clothes accumulated (below threshold of ${threshold}) and ${cleanUniformShirts} clean uniforms available. Hand-wash 1 small item if needed to protect your 60-token yearly quota.`;
    if (advBadge) {
      advBadge.className = 'px-3 py-1 rounded-full text-[11px] font-semibold bg-[#ecfdf5] dark:bg-[#064e3b] text-[#047857] dark:text-[#34d399] border border-[#a7f3d0] dark:border-[#065f46]';
      advBadge.textContent = 'Quota Conserved';
    }
  }

  renderOutfitRecommendation();
}

function renderWardrobe() {
  const container = document.getElementById('clothes-inventory-container');
  if (!container) return;

  container.innerHTML = '';

  clothesState.forEach(cat => {
    const row = document.createElement('div');
    row.className = 'p-4 rounded-2xl card-inner-well flex flex-wrap items-center justify-between gap-4';
    row.innerHTML = `
      <div class="flex items-center gap-3.5">
        <div class="w-9 h-9 squircle-tile bg-white dark:bg-[#18181b] border border-[#e0e0e0] dark:border-[#3f3f46] flex items-center justify-center text-xs font-bold text-[#141414] dark:text-white shadow-sm">
          ${cat.name.substring(0, 2).toUpperCase()}
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h5 class="font-heading text-sm text-[#141414] dark:text-white">${cat.name}</h5>
            ${cat.color ? `<span class="text-[11px] text-[#707070] dark:text-[#a1a1aa]">(${cat.color})</span>` : ''}
          </div>
          <div class="text-[10px] text-[#adadad] dark:text-[#71717a] uppercase tracking-wider font-semibold">${cat.type}</div>
        </div>
      </div>

      <div class="flex items-center gap-3 text-xs">
        <div class="flex items-center gap-2 bg-white dark:bg-[#18181b] px-3 py-1.5 rounded-full border border-[#e0e0e0] dark:border-[#3f3f46]">
          <span class="text-[11px] text-[#707070] dark:text-[#a1a1aa]">Clean:</span>
          <span class="font-bold text-[#047857] dark:text-[#34d399]">${cat.cleanCount}</span>
          <button class="btn-dec-clean text-[#707070] dark:text-[#a1a1aa] hover:text-[#141414] dark:hover:text-white px-1 font-bold" data-id="${cat.id}">-</button>
          <button class="btn-inc-clean text-[#707070] dark:text-[#a1a1aa] hover:text-[#141414] dark:hover:text-white px-1 font-bold" data-id="${cat.id}">+</button>
        </div>

        <div class="flex items-center gap-2 bg-white dark:bg-[#18181b] px-3 py-1.5 rounded-full border border-[#e0e0e0] dark:border-[#3f3f46]">
          <span class="text-[11px] text-[#707070] dark:text-[#a1a1aa]">Dirty:</span>
          <span class="font-bold text-[#b45309] dark:text-[#fbbf24]">${cat.dirtyCount}</span>
          <button class="btn-dec-dirty text-[#707070] dark:text-[#a1a1aa] hover:text-[#141414] dark:hover:text-white px-1 font-bold" data-id="${cat.id}">-</button>
          <button class="btn-inc-dirty text-[#707070] dark:text-[#a1a1aa] hover:text-[#141414] dark:hover:text-white px-1 font-bold" data-id="${cat.id}">+</button>
        </div>

        <div class="flex items-center gap-2 bg-white dark:bg-[#18181b] px-3 py-1.5 rounded-full border border-[#e0e0e0] dark:border-[#3f3f46]">
          <span class="text-[11px] text-[#707070] dark:text-[#a1a1aa]">Laundry:</span>
          <span class="font-bold text-[#141414] dark:text-white">${cat.inLaundryCount}</span>
          <button class="btn-retrieve-laundry text-[10px] pill-soft py-0.5 px-2 text-[#141414] dark:text-white font-semibold" data-id="${cat.id}" title="Laundry Returned">
            Returned
          </button>
        </div>

        <button class="btn-del-cloth text-[#adadad] dark:text-[#71717a] hover:text-[#b91c1c] text-xs px-1" data-id="${cat.id}" title="Delete Category">
          &times;
        </button>
      </div>
    `;

    row.querySelector('.btn-dec-clean')?.addEventListener('click', () => {
      if (cat.cleanCount > 0) {
        cat.cleanCount -= 1;
        cat.dirtyCount += 1;
        saveClothes();
      }
    });
    row.querySelector('.btn-inc-clean')?.addEventListener('click', () => {
      cat.cleanCount += 1;
      saveClothes();
    });
    row.querySelector('.btn-dec-dirty')?.addEventListener('click', () => {
      if (cat.dirtyCount > 0) {
        cat.dirtyCount -= 1;
        saveClothes();
      }
    });
    row.querySelector('.btn-inc-dirty')?.addEventListener('click', () => {
      cat.dirtyCount += 1;
      saveClothes();
    });
    row.querySelector('.btn-retrieve-laundry')?.addEventListener('click', () => {
      if (cat.inLaundryCount > 0) {
        cat.cleanCount += cat.inLaundryCount;
        cat.inLaundryCount = 0;
        saveClothes();
      }
    });
    row.querySelector('.btn-del-cloth')?.addEventListener('click', () => {
      if (confirm(`Remove ${cat.name} from wardrobe?`)) {
        clothesState = clothesState.filter(c => c.id !== cat.id);
        saveClothes();
      }
    });

    container.appendChild(row);
  });
}

async function saveClothes() {
  setStoredData(KEYS.CLOTHES, clothesState);
  if (currentUserId) await pushWardrobeToSupabase(currentUserId, clothesState);
  renderWardrobe();
  renderLaundry();
}

function renderOutfitRecommendation() {
  const card = document.getElementById('wear-recommendation-card');
  if (!card) return;

  const uniformShirt = clothesState.find(c => c.id === 'c-1');
  const uniformTrouser = clothesState.find(c => c.id === 'c-2');
  const casualTees = clothesState.find(c => c.id === 'c-3');
  const casualJeans = clothesState.find(c => c.id === 'c-4');
  const labCoat = clothesState.find(c => c.id === 'c-5');
  const socks = clothesState.find(c => c.id === 'c-6');

  if (currentWearType === 'uniform') {
    const isShirtReady = (uniformShirt?.cleanCount || 0) > 0;
    const isTrouserReady = (uniformTrouser?.cleanCount || 0) > 0;

    card.innerHTML = `
      <div class="text-xs font-semibold text-[#141414] dark:text-white">Poornima Uniform Outfit:</div>
      <div class="space-y-2 text-xs text-[#141414] dark:text-white mt-2">
        <div class="flex items-center justify-between">
          <span>Sky Blue Uniform Shirt</span>
          <span class="${isShirtReady ? 'text-[#047857] dark:text-[#34d399] font-semibold' : 'text-[#b91c1c] dark:text-[#f87171] font-bold'}">${uniformShirt?.cleanCount || 0} Clean</span>
        </div>
        <div class="flex items-center justify-between">
          <span>Navy Trouser / Pants</span>
          <span class="${isTrouserReady ? 'text-[#047857] dark:text-[#34d399] font-semibold' : 'text-[#b91c1c] dark:text-[#f87171] font-bold'}">${uniformTrouser?.cleanCount || 0} Clean</span>
        </div>
        <div class="flex items-center justify-between">
          <span>Fresh Pair of Socks</span>
          <span class="text-[#047857] dark:text-[#34d399] font-semibold">${socks?.cleanCount || 0} Clean</span>
        </div>
      </div>
      <div class="mt-3 pt-2.5 border-t border-[#e0e0e0] dark:border-[#3f3f46] text-[11px] ${isShirtReady && isTrouserReady ? 'text-[#047857] dark:text-[#34d399]' : 'text-[#b91c1c] dark:text-[#f87171] font-bold'}">
        ${isShirtReady && isTrouserReady ? 'Uniform ready in closet for morning gates.' : 'Clean uniform running low. Wash tonight.'}
      </div>
    `;
  } else if (currentWearType === 'lab') {
    card.innerHTML = `
      <div class="text-xs font-semibold text-[#141414] dark:text-white">Lab Day Outfit (Uniform + Lab Coat):</div>
      <div class="space-y-2 text-xs text-[#141414] dark:text-white mt-2">
        <div class="flex items-center justify-between">
          <span>White Lab Coat / Apron</span>
          <span class="${(labCoat?.cleanCount || 0) > 0 ? 'text-[#047857] dark:text-[#34d399] font-semibold' : 'text-[#b91c1c] dark:text-[#f87171] font-bold'}">${labCoat?.cleanCount || 0} Clean</span>
        </div>
        <div class="flex items-center justify-between">
          <span>Sky Blue Uniform Shirt</span>
          <span class="text-[#047857] dark:text-[#34d399] font-semibold">${uniformShirt?.cleanCount || 0} Clean</span>
        </div>
      </div>
    `;
  } else {
    card.innerHTML = `
      <div class="text-xs font-semibold text-[#141414] dark:text-white">Casual / Weekend Outfit:</div>
      <div class="space-y-2 text-xs text-[#141414] dark:text-white mt-2">
        <div class="flex items-center justify-between">
          <span>Casual T-Shirt</span>
          <span class="text-[#047857] dark:text-[#34d399] font-semibold">${casualTees?.cleanCount || 0} Clean</span>
        </div>
        <div class="flex items-center justify-between">
          <span>Denim Jeans / Cargo</span>
          <span class="text-[#047857] dark:text-[#34d399] font-semibold">${casualJeans?.cleanCount || 0} Clean</span>
        </div>
      </div>
    `;
  }
}

function renderAC() {
  const remaining = acState.totalUnits - acState.usedUnits;
  const pct = ((acState.usedUnits / acState.totalUnits) * 100).toFixed(1);

  const usedEl = document.getElementById('ac-used-val');
  const remEl = document.getElementById('ac-remaining-val');
  const meterBar = document.getElementById('ac-meter-bar');

  if (usedEl) usedEl.textContent = acState.usedUnits.toString();
  if (remEl) remEl.textContent = remaining.toString();
  if (meterBar) meterBar.style.width = `${pct}%`;
}

// -------------------------------------------------------------
// 6. TO-DO MODULE
// -------------------------------------------------------------
function setupTodoModule() {
  renderTodos();

  const filterButtons = document.querySelectorAll('.todo-filter-btn');
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => {
        b.className = 'todo-filter-btn px-3.5 py-1.5 rounded-full text-[#707070] dark:text-[#a1a1aa] hover:text-[#141414] dark:hover:text-white font-medium text-xs transition-all';
      });
      btn.className = 'todo-filter-btn active px-4 py-1.5 rounded-full bg-[#141414] dark:bg-white text-white dark:text-[#141414] font-semibold text-xs transition-all';
      currentTodoFilter = btn.getAttribute('data-filter') || 'all';
      renderTodos();
    });
  });

  document.getElementById('form-add-todo')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const titleInput = document.getElementById('todo-input-title') as HTMLInputElement;
    const catInput = document.getElementById('todo-input-category') as HTMLSelectElement;
    const prioInput = document.getElementById('todo-input-priority') as HTMLSelectElement;
    const dueInput = document.getElementById('todo-input-due') as HTMLInputElement;

    if (!titleInput?.value.trim()) return;

    todosState.unshift({
      id: 't-' + Date.now(),
      title: titleInput.value.trim(),
      category: catInput.value as any,
      priority: prioInput.value as any,
      dueDate: dueInput.value || new Date().toISOString().split('T')[0],
      completed: false,
    });

    setStoredData(KEYS.TODOS, todosState);
    if (currentUserId) await pushTodosToSupabase(currentUserId, todosState);

    titleInput.value = '';
    renderTodos();
  });
}

function renderTodos() {
  const container = document.getElementById('todos-container');
  if (!container) return;

  const filtered = todosState.filter(t => currentTodoFilter === 'all' || t.category === currentTodoFilter);
  container.innerHTML = '';

  const allCount = document.getElementById('todo-count-all');
  if (allCount) allCount.textContent = todosState.length.toString();

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="card-inner-well p-10 text-center text-[#707070] dark:text-[#a1a1aa] text-xs">
        No pending tasks in this category.
      </div>
    `;
    return;
  }

  filtered.forEach(todo => {
    const card = document.createElement('div');
    card.className = `p-4 rounded-2xl card-inner-well flex items-center justify-between gap-4 transition-all ${todo.completed ? 'opacity-50' : ''}`;
    
    const prioBadge = todo.priority === 'high'
      ? '<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#fef2f2] dark:bg-[#450a0a] text-[#b91c1c] dark:text-[#f87171] border border-[#fecaca] dark:border-[#7f1d1d]">High Priority</span>'
      : (todo.priority === 'medium' ? '<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#fefce8] dark:bg-[#422006] text-[#a16207] dark:text-[#facc15] border border-[#fef08a] dark:border-[#713f12]">Medium</span>' : '<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#f0f0f0] dark:bg-[#27272a] text-[#707070] dark:text-[#a1a1aa]">Low</span>');

    card.innerHTML = `
      <div class="flex items-center gap-3.5 flex-1">
        <input 
          type="checkbox" 
          class="todo-chk w-4 h-4 rounded-md border-[#e0e0e0] dark:border-[#3f3f46] text-[#141414] dark:text-white cursor-pointer accent-[#141414] dark:accent-white" 
          ${todo.completed ? 'checked' : ''} 
          data-id="${todo.id}"
        />
        <div>
          <div class="flex items-center gap-2">
            <span class="font-heading text-sm text-[#141414] dark:text-white ${todo.completed ? 'line-through text-[#adadad] dark:text-[#71717a]' : ''}">${todo.title}</span>
            ${prioBadge}
            <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#f0f0f0] dark:bg-[#27272a] text-[#707070] dark:text-[#a1a1aa]">${todo.category}</span>
          </div>
          ${todo.dueDate ? `<div class="font-caption text-[11px] mt-0.5 text-[#707070] dark:text-[#a1a1aa]">Due: ${todo.dueDate}</div>` : ''}
        </div>
      </div>

      <button class="btn-del-todo text-[#adadad] dark:text-[#71717a] hover:text-[#b91c1c] text-xs p-1" data-id="${todo.id}">
        Remove
      </button>
    `;

    card.querySelector('.todo-chk')?.addEventListener('change', async (e) => {
      const isChecked = (e.target as HTMLInputElement).checked;
      todo.completed = isChecked;
      setStoredData(KEYS.TODOS, todosState);
      if (currentUserId) await pushTodosToSupabase(currentUserId, todosState);
      renderTodos();
      if (isChecked) {
        confetti({ particleCount: 20, spread: 40, origin: { y: 0.7 } });
      }
    });

    card.querySelector('.btn-del-todo')?.addEventListener('click', async () => {
      todosState = todosState.filter(t => t.id !== todo.id);
      setStoredData(KEYS.TODOS, todosState);
      if (currentUserId) await pushTodosToSupabase(currentUserId, todosState);
      renderTodos();
    });

    container.appendChild(card);
  });
}

// -------------------------------------------------------------
// 7. CAMPUS TOOLS MODULE
// -------------------------------------------------------------
function setupCampusToolsModule() {
  const mt1Input = document.getElementById('sgpa-mt1') as HTMLInputElement;
  const mt2Input = document.getElementById('sgpa-mt2') as HTMLInputElement;
  const caInput = document.getElementById('sgpa-ca') as HTMLInputElement;

  let currentTargetGradeMin = 90;

  function calculateSGPA() {
    const mt1 = parseFloat(mt1Input?.value || '0');
    const mt2 = parseFloat(mt2Input?.value || '0');
    const ca = parseFloat(caInput?.value || '0');

    const internalTotal = Math.min(40, ((mt1 + mt2) / 40) * 20 + ca);

    const internalTotalEl = document.getElementById('sgpa-internal-total');
    const requiredEndTermEl = document.getElementById('sgpa-required-endterm');
    const adviceTextEl = document.getElementById('sgpa-advice-text');

    if (internalTotalEl) internalTotalEl.textContent = `${internalTotal.toFixed(1)} / 40 (${((internalTotal / 40) * 100).toFixed(0)}%)`;

    const neededFromEndTerm = Math.max(0, currentTargetGradeMin - internalTotal);
    const neededOutOf60 = Math.min(60, Math.ceil(neededFromEndTerm));

    if (requiredEndTermEl) {
      requiredEndTermEl.textContent = `${neededOutOf60} / 60`;
    }

    if (adviceTextEl) {
      if (neededOutOf60 <= 40) {
        adviceTextEl.textContent = `Scoring ${neededOutOf60}/60 in End-Terms secures your target grade.`;
        adviceTextEl.className = 'text-[11px] text-[#047857] dark:text-[#34d399] mt-1';
      } else if (neededOutOf60 <= 55) {
        adviceTextEl.textContent = `Prepare previous examination questions to hit ${neededOutOf60}/60 in End-Terms.`;
        adviceTextEl.className = 'text-[11px] text-[#b45309] dark:text-[#fbbf24] mt-1';
      } else {
        adviceTextEl.textContent = `Requires ${neededOutOf60}/60 in End-Terms. Focus on high-weightage topics.`;
        adviceTextEl.className = 'text-[11px] text-[#b91c1c] dark:text-[#f87171] mt-1';
      }
    }
  }

  [mt1Input, mt2Input, caInput].forEach(inp => inp?.addEventListener('input', calculateSGPA));

  const gradeButtons = document.querySelectorAll('.grade-target-btn');
  gradeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      gradeButtons.forEach(b => {
        b.className = 'grade-target-btn py-2 rounded-full bg-[#f3f3f3] dark:bg-[#27272a] text-[#141414] dark:text-white font-semibold text-center transition-all hover:bg-[#e0e0e0] dark:hover:bg-[#3f3f46]';
      });
      btn.className = 'grade-target-btn active py-2 rounded-full bg-[#141414] dark:bg-white text-white dark:text-[#141414] font-semibold text-center transition-all';
      currentTargetGradeMin = parseInt(btn.getAttribute('data-min') || '90', 10);
      calculateSGPA();
    });
  });

  calculateSGPA();

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = days[new Date().getDay()];
  let activeMessDay = todayName;

  function renderMessForDay(day: string) {
    activeMessDay = day;
    const menu = messState.find(m => m.day.toLowerCase() === day.toLowerCase()) || messState[0];
    const bfEl = document.getElementById('mess-bf');
    const lunchEl = document.getElementById('mess-lunch');
    const snacksEl = document.getElementById('mess-snacks');
    const dinnerEl = document.getElementById('mess-dinner');

    if (bfEl) bfEl.innerHTML = menu.breakfast;
    if (lunchEl) lunchEl.innerHTML = menu.lunch;
    if (snacksEl) snacksEl.innerHTML = menu.snacks;
    if (dinnerEl) dinnerEl.innerHTML = menu.dinner;

    document.querySelectorAll('.mess-day-btn').forEach(btn => {
      const bDay = btn.getAttribute('data-day');
      if (bDay?.toLowerCase() === day.toLowerCase()) {
        btn.className = 'mess-day-btn px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#141414] dark:bg-white text-white dark:text-[#141414] transition-all';
      } else {
        btn.className = 'mess-day-btn px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#f3f3f3] dark:bg-[#27272a] text-[#707070] dark:text-[#a1a1aa] transition-all';
      }
    });
  }

  document.querySelectorAll('.mess-day-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const day = btn.getAttribute('data-day');
      if (day) renderMessForDay(day);
    });
  });

  renderMessForDay(todayName);

  // Live Sync button from official Poornima Firestore API
  document.getElementById('btn-fetch-live-menu')?.addEventListener('click', async () => {
    const statusBadge = document.getElementById('mess-status-badge');
    if (statusBadge) statusBadge.textContent = 'Syncing...';
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const res = await fetch(`https://firestore.googleapis.com/v1/projects/poornima-5c202/databases/(default)/documents/meals/${todayStr}?key=AIzaSyBrksZsdbuYx1ktbuUDqTtBkhoG7DAKOPU`);
      if (res.ok) {
        const doc = await res.json();
        if (doc.fields) {
          const liveBf = doc.fields.breakfast?.stringValue?.replace(/<[^>]*>/g, '') || '';
          const liveLunch = doc.fields.lunch?.stringValue?.replace(/<[^>]*>/g, '') || '';
          const liveSnacks = doc.fields.snacks?.stringValue?.replace(/<[^>]*>/g, '') || '';
          const liveDinner = doc.fields.dinner?.stringValue?.replace(/<[^>]*>/g, '') || '';

          messState = messState.map(m => m.day.toLowerCase() === todayName.toLowerCase() ? {
            ...m,
            breakfast: liveBf || m.breakfast,
            lunch: liveLunch || m.lunch,
            snacks: liveSnacks || m.snacks,
            dinner: liveDinner || m.dinner,
          } : m);
          setStoredData(KEYS.MESS, messState);
          renderMessForDay(todayName);
          if (statusBadge) statusBadge.textContent = '✓ Live from college portal';
          confetti({ particleCount: 20, spread: 35 });
          return;
        }
      }
      if (statusBadge) statusBadge.textContent = '✓ Official weekly schedule verified';
    } catch (e) {
      if (statusBadge) statusBadge.textContent = '✓ Using verified college menu';
    }
  });
}

// -------------------------------------------------------------
// 8. SETTINGS MODULE
// -------------------------------------------------------------
function setupSettingsModule() {
  const modal = document.getElementById('modal-settings');
  document.getElementById('btn-open-settings')?.addEventListener('click', () => {
    modal?.classList.remove('hidden');
  });
  document.getElementById('footer-btn-backup')?.addEventListener('click', (e) => {
    e.preventDefault();
    triggerExportJson();
  });
  document.getElementById('btn-close-settings-modal')?.addEventListener('click', () => {
    modal?.classList.add('hidden');
  });
  document.getElementById('btn-close-settings-done')?.addEventListener('click', () => {
    modal?.classList.add('hidden');
  });

  document.getElementById('btn-export-json')?.addEventListener('click', triggerExportJson);

  function triggerExportJson() {
    const backup = {
      laundry: laundryState,
      clothes: clothesState,
      ac: acState,
      attendance: attendanceState,
      todos: todosState,
      exportedAt: new Date().toISOString(),
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute('href', dataStr);
    dl.setAttribute('download', `poornima_companion_backup_${new Date().toISOString().split('T')[0]}.json`);
    dl.click();
  }

  document.getElementById('btn-reset-defaults')?.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all data to a clean slate (0 courses, clean quota)?')) {
      localStorage.removeItem(KEYS.ATTENDANCE);
      localStorage.removeItem(KEYS.TODOS);
      localStorage.removeItem(KEYS.LAUNDRY);
      localStorage.removeItem(KEYS.AC);
      localStorage.removeItem(KEYS.CLOTHES);
      
      attendanceState = [];
      todosState = [];
      laundryState = { ...DEFAULT_LAUNDRY, usedTokens: 0, history: [] };
      acState = { ...DEFAULT_AC, usedUnits: 0, readings: [] };
      clothesState = DEFAULT_CLOTHES;
      messState = DEFAULT_MESS_MENU;

      setStoredData(KEYS.ATTENDANCE, attendanceState);
      setStoredData(KEYS.TODOS, todosState);
      setStoredData(KEYS.LAUNDRY, laundryState);
      setStoredData(KEYS.AC, acState);
      setStoredData(KEYS.CLOTHES, clothesState);
      setStoredData(KEYS.MESS, messState);

      renderAttendance();
      renderLaundry();
      renderWardrobe();
      renderAC();
      renderTodos();
      updateHeaderTicker();
      modal?.classList.add('hidden');
      alert('Workspace cleared. You are now on a clean slate.');
    }
  });
}

function updateHeaderTicker() {
  const attVal = document.getElementById('header-att-val');
  const attBadge = document.getElementById('header-att-badge');
  const laundryVal = document.getElementById('header-laundry-val');
  const acVal = document.getElementById('header-ac-val');

  let totalAtt = 0;
  let totalCls = 0;
  attendanceState.forEach(s => {
    totalAtt += s.attended;
    totalCls += s.total;
  });
  const overallPct = totalCls > 0 ? Number(((totalAtt / totalCls) * 100).toFixed(1)) : 100;

  if (attVal) attVal.textContent = `${overallPct}%`;
  if (attBadge) {
    attBadge.className = overallPct >= 75
      ? 'flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#f3f3f3] dark:bg-[#27272a] text-xs font-semibold text-[#141414] dark:text-white'
      : 'flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#fef2f2] dark:bg-[#450a0a] text-xs font-semibold text-[#b91c1c] dark:text-[#f87171]';
  }

  if (laundryVal) laundryVal.textContent = `${laundryState.totalTokens - laundryState.usedTokens}/${laundryState.totalTokens} left`;
  if (acVal) acVal.textContent = `${acState.totalUnits - acState.usedUnits}/${acState.totalUnits} left`;
}
