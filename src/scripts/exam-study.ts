import confetti from 'canvas-confetti';
import type { AttendanceSubject, ExamStudyState, FlowchartNode, TimetableSlot } from '../lib/types';
import { KEYS, getStoredData, setStoredData } from '../lib/storage';
import { DEFAULT_EXAM_STUDY, generateAiStudyPlan, calculateStudyMetrics } from '../lib/exam-planner';

export function setupExamStudy(getAttendanceSubjects: () => AttendanceSubject[]) {
  let examStudyState: ExamStudyState = getStoredData(KEYS.EXAM_STUDY, DEFAULT_EXAM_STUDY);
  let activeSubview: 'flowchart' | 'timetable' | 'pomodoro' = 'flowchart';
  let activeSubjectFilter: string = 'all';
  let activeTimetableDay: number = 0;
  let countdownTimerInterval: any = null;

  // Pomodoro state
  let pomoTimer: any = null;
  let pomoSecondsLeft = 25 * 60;
  let isPomoRunning = false;
  let pomoMode: 'focus' | 'break' = 'focus';

  // -------------------------------------------------------------
  // 1. COUNTDOWN & PROGRESS METRICS
  // -------------------------------------------------------------
  function updateCountdownAndMetrics() {
    const metrics = calculateStudyMetrics(examStudyState);

    // Days badge & Target text
    const badgeDays = document.getElementById('exam-badge-days');
    if (badgeDays) badgeDays.textContent = `${metrics.daysRemaining} Days Remaining`;

    const titleEl = document.getElementById('exam-display-title');
    if (titleEl) titleEl.textContent = examStudyState.examName || 'Mid-Term 1 Examinations';

    const targetText = document.getElementById('countdown-target-text');
    if (targetText) targetText.textContent = `Target: ${examStudyState.targetDate} (${examStudyState.examName})`;

    // Countdown digits
    const daysEl = document.getElementById('countdown-days');
    const hoursEl = document.getElementById('countdown-hours');
    const minsEl = document.getElementById('countdown-minutes');
    const secsEl = document.getElementById('countdown-seconds');

    const now = new Date().getTime();
    const target = new Date(examStudyState.targetDate + 'T09:00:00').getTime();
    const diff = Math.max(0, target - now);

    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);

    if (daysEl) daysEl.textContent = String(d).padStart(2, '0');
    if (hoursEl) hoursEl.textContent = String(h).padStart(2, '0');
    if (minsEl) minsEl.textContent = String(m).padStart(2, '0');
    if (secsEl) secsEl.textContent = String(s).padStart(2, '0');

    // Mastery Metric
    const masteryPctEl = document.getElementById('metric-mastery-pct');
    const nodesRatioEl = document.getElementById('metric-nodes-ratio');
    const masteryBar = document.getElementById('metric-mastery-bar');
    const masteredCount = document.getElementById('metric-mastered-count');
    const inProgCount = document.getElementById('metric-in-progress-count');
    const todoCount = document.getElementById('metric-todo-count');

    if (masteryPctEl) masteryPctEl.textContent = `${metrics.masteryPercentage}%`;
    if (nodesRatioEl) nodesRatioEl.textContent = `${metrics.masteredNodes} of ${metrics.totalNodes} topics`;
    if (masteryBar) (masteryBar as HTMLElement).style.width = `${metrics.masteryPercentage}%`;
    if (masteredCount) masteredCount.textContent = `${metrics.masteredNodes} Mastered`;
    if (inProgCount) inProgCount.textContent = `${metrics.inProgressNodes} In Progress`;
    if (todoCount) todoCount.textContent = `${metrics.totalNodes - metrics.masteredNodes - metrics.inProgressNodes} To Do`;

    // Revision Hours Metric
    const compHoursEl = document.getElementById('metric-completed-hours');
    const totHoursEl = document.getElementById('metric-total-hours');
    const hoursBar = document.getElementById('metric-hours-bar');
    const compSlotsEl = document.getElementById('metric-completed-slots');

    const hoursPct = metrics.totalHours > 0 ? Math.round((metrics.completedHours / metrics.totalHours) * 100) : 0;
    if (compHoursEl) compHoursEl.textContent = `${metrics.completedHours}h`;
    if (totHoursEl) totHoursEl.textContent = `of ${metrics.totalHours}h total`;
    if (hoursBar) (hoursBar as HTMLElement).style.width = `${hoursPct}%`;
    if (compSlotsEl) compSlotsEl.textContent = `${metrics.completedSlots} / ${metrics.totalSlots} sessions completed`;
  }

  function startCountdownInterval() {
    if (countdownTimerInterval) clearInterval(countdownTimerInterval);
    updateCountdownAndMetrics();
    countdownTimerInterval = setInterval(updateCountdownAndMetrics, 1000);
  }

  // -------------------------------------------------------------
  // 2. SUB-VIEW SWITCHING
  // -------------------------------------------------------------
  function switchExamSubview(subview: 'flowchart' | 'timetable' | 'pomodoro') {
    activeSubview = subview;

    const tabs = document.querySelectorAll('.exam-subview-tab');
    tabs.forEach(tab => {
      const target = tab.getAttribute('data-subview');
      if (target === subview) {
        tab.className = 'exam-subview-tab active px-4 py-1.5 rounded-full bg-[#09090b] dark:bg-white text-white dark:text-[#09090b] font-semibold transition-all shadow-sm flex items-center gap-1.5';
      } else {
        tab.className = 'exam-subview-tab px-4 py-1.5 rounded-full text-[#71717a] dark:text-[#a1a1aa] hover:text-[#09090b] dark:hover:text-white font-medium transition-all flex items-center gap-1.5';
      }
    });

    const cFlowchart = document.getElementById('exam-subview-flowchart-container');
    const cTimetable = document.getElementById('exam-subview-timetable-container');
    const cPomodoro = document.getElementById('exam-subview-pomodoro-container');

    if (cFlowchart) cFlowchart.classList.toggle('hidden', subview !== 'flowchart');
    if (cTimetable) cTimetable.classList.toggle('hidden', subview !== 'timetable');
    if (cPomodoro) cPomodoro.classList.toggle('hidden', subview !== 'pomodoro');

    if (subview === 'flowchart') renderFlowchart();
    if (subview === 'timetable') renderTimetable();
    if (subview === 'pomodoro') renderPomodoro();
  }

  // -------------------------------------------------------------
  // 3. SUBJECT FILTER PILLS
  // -------------------------------------------------------------
  function renderSubjectFilterPills() {
    const container = document.getElementById('exam-subject-filter-container');
    if (!container) return;

    // Collect unique subjects from nodes
    const subjects = Array.from(new Set(examStudyState.nodes.map(n => n.subject).filter(Boolean)));

    let html = `
      <button class="exam-filter-btn ${activeSubjectFilter === 'all' ? 'active px-3 py-1 rounded-full bg-[#09090b] dark:bg-white text-white dark:text-[#09090b] font-semibold' : 'px-3 py-1 rounded-full text-[#71717a] dark:text-[#a1a1aa] hover:bg-[#f1f3f5] dark:hover:bg-[#27272a]'}" data-subject="all">
        All Subjects
      </button>
    `;

    subjects.forEach(sub => {
      const isActive = activeSubjectFilter === sub;
      html += `
        <button class="exam-filter-btn ${isActive ? 'active px-3 py-1 rounded-full bg-[#09090b] dark:bg-white text-white dark:text-[#09090b] font-semibold' : 'px-3 py-1 rounded-full text-[#71717a] dark:text-[#a1a1aa] hover:bg-[#f1f3f5] dark:hover:bg-[#27272a]'}" data-subject="${sub}">
          ${sub}
        </button>
      `;
    });

    container.innerHTML = html;

    container.querySelectorAll('.exam-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeSubjectFilter = btn.getAttribute('data-subject') || 'all';
        renderSubjectFilterPills();
        if (activeSubview === 'flowchart') renderFlowchart();
        if (activeSubview === 'timetable') renderTimetable();
      });
    });
  }

  // -------------------------------------------------------------
  // 4. FLOWCHART CANVAS RENDERING & INTERACTION
  // -------------------------------------------------------------
  function getSubjectColor(sub: string) {
    const s = sub.toLowerCase();
    if (s.includes('physics')) return { bg: 'bg-sky-500/10 dark:bg-sky-500/20', text: 'text-sky-600 dark:text-sky-400', border: 'border-sky-500/30', accent: '#0284c7' };
    if (s.includes('civil')) return { bg: 'bg-emerald-500/10 dark:bg-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/30', accent: '#059669' };
    if (s.includes('recruitment') || s.includes('crt')) return { bg: 'bg-purple-500/10 dark:bg-purple-500/20', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500/30', accent: '#9333ea' };
    if (s.includes('math')) return { bg: 'bg-amber-500/10 dark:bg-amber-500/20', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/30', accent: '#d97706' };
    return { bg: 'bg-blue-500/10 dark:bg-blue-500/20', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/30', accent: '#2563eb' };
  }

  function renderFlowchart() {
    const nodesContainer = document.getElementById('flowchart-nodes-container');
    const svgLayer = document.getElementById('flowchart-svg-layer');
    if (!nodesContainer || !svgLayer) return;

    const filteredNodes = activeSubjectFilter === 'all'
      ? examStudyState.nodes
      : examStudyState.nodes.filter(n => n.subject === activeSubjectFilter || n.subject === 'All Subjects');

    if (filteredNodes.length === 0) {
      nodesContainer.innerHTML = `
        <div class="p-12 text-center space-y-3">
          <div class="text-3xl">📄</div>
          <div class="font-heading text-base text-[#09090b] dark:text-white">Flowchart Canvas Empty</div>
          <p class="text-xs text-[#71717a] dark:text-[#a1a1aa] max-w-sm mx-auto">
            Click "AI Study Roadmap" to generate a complete revision flowchart, or "Add Topic" to build it manually.
          </p>
          <div class="flex items-center justify-center gap-2 pt-2">
            <button id="btn-empty-ai-gen" class="pill-primary text-xs">⚡ AI Study Roadmap</button>
            <button id="btn-empty-add-node" class="pill-soft text-xs">➕ Add First Topic</button>
          </div>
        </div>
      `;
      svgLayer.innerHTML = '';
      document.getElementById('btn-empty-ai-gen')?.addEventListener('click', () => {
        document.getElementById('btn-open-ai-generator')?.click();
      });
      document.getElementById('btn-empty-add-node')?.addEventListener('click', () => {
        openEditNodeModal();
      });
      return;
    }

    // Render Nodes HTML
    let nodesHtml = '';
    filteredNodes.forEach(node => {
      const color = getSubjectColor(node.subject);
      const isMastered = node.status === 'mastered';
      const isInProg = node.status === 'in_progress';

      const statusBadge = isMastered
        ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">🟢 Mastered</span>`
        : isInProg
        ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">🟡 In Progress</span>`
        : `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#f1f3f5] dark:bg-[#27272a] text-[#71717a] dark:text-[#a1a1aa]">⚪ To Do</span>`;

      const priorityBadge = node.priority === 'high'
        ? `<span class="text-[10px] font-semibold text-rose-500">★ High Priority</span>`
        : `<span class="text-[10px] text-[#71717a] dark:text-[#a1a1aa]">${node.estimatedHours}h est</span>`;

      nodesHtml += `
        <div 
          id="node-card-${node.id}" 
          class="flowchart-node-card absolute w-[240px] bg-white dark:bg-[#18181b] border ${isMastered ? 'border-emerald-500/50 shadow-emerald-500/10' : 'border-[#e4e4e7] dark:border-[#27272a]'} rounded-2xl p-3.5 shadow-sm hover:shadow-md transition-all select-none cursor-pointer group"
          style="left: ${node.x || 40}px; top: ${node.y || 40}px;"
          data-node-id="${node.id}"
        >
          <!-- Top Row: Subject pill & Status Toggle -->
          <div class="flex items-center justify-between gap-2 mb-2">
            <span class="px-2 py-0.5 rounded-md text-[10px] font-semibold ${color.bg} ${color.text} border ${color.border} truncate max-w-[130px]">
              ${node.subject}
            </span>
            <button class="node-status-toggle" data-node-id="${node.id}" title="Click to cycle status: To Do → In Progress → Mastered">
              ${statusBadge}
            </button>
          </div>

          <!-- Title -->
          <h4 class="font-heading text-xs text-[#09090b] dark:text-white line-clamp-2 leading-snug mb-1.5">
            ${node.title}
          </h4>

          <!-- Notes preview if present -->
          ${node.notes ? `<p class="text-[10px] text-[#71717a] dark:text-[#a1a1aa] line-clamp-1 mb-2 font-caption italic">${node.notes}</p>` : ''}

          <!-- Bottom bar: Priority & Actions -->
          <div class="flex items-center justify-between pt-2 border-t border-[#f1f3f5] dark:border-[#27272a] text-[10px]">
            <div>${priorityBadge}</div>
            <div class="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
              <button class="btn-node-edit p-1 rounded hover:bg-[#f1f3f5] dark:hover:bg-[#27272a] text-[#71717a] dark:text-[#a1a1aa]" data-node-id="${node.id}" title="Edit topic">✏️</button>
              <button class="btn-node-study p-1 rounded hover:bg-[#f1f3f5] dark:hover:bg-[#27272a] text-[#0066ff] dark:text-[#60a5fa]" data-node-id="${node.id}" title="Study in Pomodoro">⏱️</button>
              <button class="btn-node-del p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500" data-node-id="${node.id}" title="Delete topic">🗑️</button>
            </div>
          </div>
        </div>
      `;
    });

    nodesContainer.innerHTML = nodesHtml;

    // Attach Node Events
    nodesContainer.querySelectorAll('.node-status-toggle').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-node-id');
        toggleNodeStatus(id);
      });
    });

    nodesContainer.querySelectorAll('.btn-node-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-node-id');
        const node = examStudyState.nodes.find(n => n.id === id);
        if (node) openEditNodeModal(node);
      });
    });

    nodesContainer.querySelectorAll('.btn-node-study').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-node-id');
        const node = examStudyState.nodes.find(n => n.id === id);
        if (node) {
          examStudyState.pomodoro.activeSubject = node.subject;
          examStudyState.pomodoro.activeNodeId = node.id;
          saveExamState();
          switchExamSubview('pomodoro');
        }
      });
    });

    nodesContainer.querySelectorAll('.btn-node-del').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-node-id');
        if (confirm('Delete this topic node from the flowchart?')) {
          deleteNode(id);
        }
      });
    });

    // Make Nodes Draggable on Canvas
    setupNodeDragging(nodesContainer);

    // Draw SVG Connector Arrows
    drawSvgConnectors(filteredNodes, svgLayer);
  }

  function drawSvgConnectors(nodes: FlowchartNode[], svgLayer: HTMLElement) {
    const nodeMap = new Map<string, FlowchartNode>();
    nodes.forEach(n => nodeMap.set(n.id, n));

    let pathsHtml = `
      <defs>
        <marker id="arrow-default" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 9 5 L 0 9 z" fill="#a1a1aa" />
        </marker>
        <marker id="arrow-active" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 9 5 L 0 9 z" fill="#10b981" />
        </marker>
      </defs>
    `;

    nodes.forEach(source => {
      if (!source.connectsTo || source.connectsTo.length === 0) return;

      const sx = (source.x || 40) + 240; // right edge of card
      const sy = (source.y || 40) + 55;  // vertical center of card

      source.connectsTo.forEach(targetId => {
        const target = nodeMap.get(targetId);
        if (!target) return;

        const tx = target.x || 40;       // left edge of target card
        const ty = (target.y || 40) + 55; // vertical center of target card

        const isMastered = source.status === 'mastered';
        const strokeColor = isMastered ? '#10b981' : '#a1a1aa';
        const marker = isMastered ? 'url(#arrow-active)' : 'url(#arrow-default)';

        // Bezier curve control points
        const dx = Math.max(40, (tx - sx) / 2);
        const pathD = `M ${sx} ${sy} C ${sx + dx} ${sy}, ${tx - dx} ${ty}, ${tx} ${ty}`;

        pathsHtml += `
          <path 
            d="${pathD}" 
            fill="none" 
            stroke="${strokeColor}" 
            stroke-width="${isMastered ? 2.5 : 1.5}" 
            stroke-dasharray="${isMastered ? 'none' : '4 3'}" 
            marker-end="${marker}"
            class="transition-all duration-300 ${isMastered ? 'drop-shadow-[0_0_4px_rgba(16,185,129,0.3)]' : 'opacity-60'}"
          />
        `;
      });
    });

    svgLayer.innerHTML = pathsHtml;
  }

  function setupNodeDragging(container: HTMLElement) {
    const cards = container.querySelectorAll('.flowchart-node-card');
    cards.forEach(card => {
      let isDragging = false;
      let startX = 0;
      let startY = 0;
      let initLeft = 0;
      let initTop = 0;

      card.addEventListener('mousedown', (e: any) => {
        if (e.target.closest('button') || e.target.closest('input')) return;
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        initLeft = parseInt((card as HTMLElement).style.left || '40', 10);
        initTop = parseInt((card as HTMLElement).style.top || '40', 10);
        (card as HTMLElement).style.zIndex = '50';

        const onMouseMove = (moveEvent: MouseEvent) => {
          if (!isDragging) return;
          const dx = moveEvent.clientX - startX;
          const dy = moveEvent.clientY - startY;
          const newLeft = Math.max(10, initLeft + dx);
          const newTop = Math.max(10, initTop + dy);
          (card as HTMLElement).style.left = `${newLeft}px`;
          (card as HTMLElement).style.top = `${newTop}px`;

          // Update data object
          const id = card.getAttribute('data-node-id');
          const node = examStudyState.nodes.find(n => n.id === id);
          if (node) {
            node.x = newLeft;
            node.y = newTop;
          }

          // Redraw lines on drag
          const svgLayer = document.getElementById('flowchart-svg-layer');
          if (svgLayer) drawSvgConnectors(examStudyState.nodes, svgLayer);
        };

        const onMouseUp = () => {
          isDragging = false;
          (card as HTMLElement).style.zIndex = '20';
          saveExamState();
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('mouseup', onMouseUp);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
      });
    });
  }

  function toggleNodeStatus(nodeId: string | null) {
    if (!nodeId) return;
    const node = examStudyState.nodes.find(n => n.id === nodeId);
    if (!node) return;

    if (node.status === 'todo') {
      node.status = 'in_progress';
    } else if (node.status === 'in_progress') {
      node.status = 'mastered';
      confetti({ particleCount: 30, spread: 45 });
    } else {
      node.status = 'todo';
    }

    saveExamState();
    renderFlowchart();
    updateCountdownAndMetrics();
  }

  function autoLayoutFlowchart() {
    const phases = ['phase1_fundamentals', 'phase2_practice', 'phase3_pyqs', 'phase4_mock_revision'];
    const colWidth = 280;
    const xBase = 40;

    phases.forEach((phase, colIdx) => {
      const nodesInPhase = examStudyState.nodes.filter(n => n.phase === phase);
      let y = 60;
      nodesInPhase.forEach(node => {
        node.x = xBase + colIdx * colWidth;
        node.y = y;
        y += 160;
      });
    });

    saveExamState();
    renderFlowchart();
    confetti({ particleCount: 20, spread: 40 });
  }

  function deleteNode(nodeId: string | null) {
    if (!nodeId) return;
    examStudyState.nodes = examStudyState.nodes.filter(n => n.id !== nodeId);
    // Remove references in connectsTo
    examStudyState.nodes.forEach(n => {
      n.connectsTo = (n.connectsTo || []).filter(cId => cId !== nodeId);
    });
    saveExamState();
    renderFlowchart();
    updateCountdownAndMetrics();
    renderSubjectFilterPills();
  }

  // -------------------------------------------------------------
  // 5. DAY-BY-DAY TIMETABLE RENDERING
  // -------------------------------------------------------------
  function renderTimetable() {
    const pillsContainer = document.getElementById('timetable-day-pills');
    const slotsContainer = document.getElementById('timetable-slots-list');
    if (!pillsContainer || !slotsContainer) return;

    // Collect unique days from timetable
    const days = Array.from(new Set(examStudyState.timetable.map(s => s.dayIndex))).sort((a, b) => a - b);
    if (days.length === 0) {
      slotsContainer.innerHTML = `<div class="col-span-2 p-8 text-center text-xs text-[#71717a]">No study sessions scheduled yet. Click "AI Study Roadmap" to generate.</div>`;
      return;
    }

    if (!days.includes(activeTimetableDay)) activeTimetableDay = days[0];

    // Render Day Pills
    let pillsHtml = '';
    days.forEach(dIdx => {
      const firstSlot = examStudyState.timetable.find(s => s.dayIndex === dIdx);
      const dayName = firstSlot ? firstSlot.dayName : `Day ${dIdx + 1}`;
      const isToday = dIdx === 0;
      const isActive = activeTimetableDay === dIdx;

      pillsHtml += `
        <button 
          class="tt-day-btn px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
            isActive 
              ? 'bg-[#09090b] dark:bg-white text-white dark:text-[#09090b]' 
              : 'text-[#71717a] dark:text-[#a1a1aa] hover:bg-[#f1f3f5] dark:hover:bg-[#27272a]'
          }"
          data-day="${dIdx}"
        >
          ${isToday ? '📌 Today' : dayName} (D${dIdx + 1})
        </button>
      `;
    });
    pillsContainer.innerHTML = pillsHtml;

    pillsContainer.querySelectorAll('.tt-day-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeTimetableDay = parseInt(btn.getAttribute('data-day') || '0', 10);
        renderTimetable();
      });
    });

    // Render Slots for Active Day
    const activeSlots = examStudyState.timetable.filter(s => s.dayIndex === activeTimetableDay);
    const completedCount = activeSlots.filter(s => s.completed).length;

    const headingEl = document.getElementById('active-day-heading');
    const badgeEl = document.getElementById('active-day-progress-badge');
    const firstActive = activeSlots[0];

    if (headingEl && firstActive) {
      headingEl.textContent = `${activeTimetableDay === 0 ? "Today's Schedule" : firstActive.dayName + "'s Schedule"} — ${firstActive.dateStr}`;
    }
    if (badgeEl) {
      badgeEl.textContent = `${completedCount} / ${activeSlots.length} Sessions Completed`;
    }

    let slotsHtml = '';
    activeSlots.forEach(slot => {
      const color = getSubjectColor(slot.subject);
      const isDone = slot.completed;

      slotsHtml += `
        <div class="card-inner-well p-4 rounded-2xl flex items-start justify-between gap-3 border ${isDone ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-[#e4e4e7] dark:border-[#27272a]'} transition-all">
          <div class="flex items-start gap-3 flex-1 min-w-0">
            <!-- Checkbox -->
            <button 
              class="tt-slot-checkbox mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                isDone 
                  ? 'bg-emerald-500 border-emerald-500 text-white' 
                  : 'border-[#d4d4d8] dark:border-[#3f3f46] hover:border-emerald-500 text-transparent'
              }"
              data-slot-id="${slot.id}"
              title="Mark session completed"
            >
              ✓
            </button>

            <div class="space-y-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 rounded text-[10px] font-semibold ${color.bg} ${color.text} border ${color.border}">
                  ${slot.subject}
                </span>
                <span class="text-[11px] font-semibold text-[#71717a] dark:text-[#a1a1aa]">
                  ⏰ ${slot.timeRange}
                </span>
              </div>
              <h4 class="font-heading text-xs text-[#09090b] dark:text-white ${isDone ? 'line-through opacity-70' : ''}">
                ${slot.topic}
              </h4>
              <div class="text-[10px] text-[#71717a] dark:text-[#a1a1aa]">
                Target: ${slot.targetHours} Hours focus sprint
              </div>
            </div>
          </div>

          <div class="flex items-center gap-1 shrink-0">
            <button class="btn-slot-study p-1 text-xs hover:bg-[#f1f3f5] dark:hover:bg-[#27272a] rounded" data-slot-id="${slot.id}" title="Study in Pomodoro">
              ⏱️
            </button>
            <button class="btn-slot-del p-1 text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded" data-slot-id="${slot.id}" title="Delete session">
              🗑️
            </button>
          </div>
        </div>
      `;
    });

    slotsContainer.innerHTML = slotsHtml;

    // Slot Events
    slotsContainer.querySelectorAll('.tt-slot-checkbox').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-slot-id');
        const slot = examStudyState.timetable.find(s => s.id === id);
        if (slot) {
          slot.completed = !slot.completed;
          if (slot.completed) confetti({ particleCount: 25, spread: 40 });
          saveExamState();
          renderTimetable();
          updateCountdownAndMetrics();
        }
      });
    });

    slotsContainer.querySelectorAll('.btn-slot-study').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-slot-id');
        const slot = examStudyState.timetable.find(s => s.id === id);
        if (slot) {
          examStudyState.pomodoro.activeSubject = slot.subject;
          saveExamState();
          switchExamSubview('pomodoro');
        }
      });
    });

    slotsContainer.querySelectorAll('.btn-slot-del').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-slot-id');
        examStudyState.timetable = examStudyState.timetable.filter(s => s.id !== id);
        saveExamState();
        renderTimetable();
        updateCountdownAndMetrics();
      });
    });
  }

  // -------------------------------------------------------------
  // 6. POMODORO FOCUS STATION
  // -------------------------------------------------------------
  function renderPomodoro() {
    const selectEl = document.getElementById('pomo-node-select') as HTMLSelectElement;
    if (selectEl) {
      let optionsHtml = '';
      examStudyState.nodes.forEach(n => {
        const isSelected = n.id === examStudyState.pomodoro.activeNodeId;
        optionsHtml += `<option value="${n.id}" ${isSelected ? 'selected' : ''}>${n.subject}: ${n.title}</option>`;
      });
      selectEl.innerHTML = optionsHtml;
    }

    updatePomodoroDisplay();
  }

  function updatePomodoroDisplay() {
    const displayEl = document.getElementById('pomo-display-time');
    const ringEl = document.querySelector<SVGCircleElement>('#pomo-progress-ring');
    const modeBadge = document.getElementById('pomo-mode-badge');
    const loggedMins = document.getElementById('pomo-logged-mins');

    const m = Math.floor(pomoSecondsLeft / 60);
    const s = pomoSecondsLeft % 60;
    if (displayEl) displayEl.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

    const totalSecs = pomoMode === 'focus' ? (examStudyState.pomodoro.durationMinutes * 60) : (examStudyState.pomodoro.breakMinutes * 60);
    const progressFraction = Math.max(0, 1 - (pomoSecondsLeft / totalSecs));
    const circumference = 276.46;
    if (ringEl) {
      ringEl.style.strokeDashoffset = `${circumference * (1 - progressFraction)}`;
    }

    if (modeBadge) modeBadge.textContent = pomoMode === 'focus' ? 'Focus Session' : 'Rest Break';
    if (loggedMins) loggedMins.textContent = `${examStudyState.pomodoro.totalMinutesLogged || 0} mins`;
  }

  function startPomodoro() {
    if (isPomoRunning) return;
    isPomoRunning = true;
    document.getElementById('btn-pomo-start')?.classList.add('hidden');
    document.getElementById('btn-pomo-pause')?.classList.remove('hidden');

    pomoTimer = setInterval(() => {
      if (pomoSecondsLeft > 0) {
        pomoSecondsLeft--;
        updatePomodoroDisplay();
      } else {
        clearInterval(pomoTimer);
        isPomoRunning = false;
        confetti({ particleCount: 50, spread: 60 });

        if (pomoMode === 'focus') {
          examStudyState.pomodoro.totalMinutesLogged = (examStudyState.pomodoro.totalMinutesLogged || 0) + examStudyState.pomodoro.durationMinutes;
          saveExamState();
          pomoMode = 'break';
          pomoSecondsLeft = examStudyState.pomodoro.breakMinutes * 60;
          alert('🎉 Focus sprint completed! Take a 5-minute break.');
        } else {
          pomoMode = 'focus';
          pomoSecondsLeft = examStudyState.pomodoro.durationMinutes * 60;
          alert('⏰ Break finished! Ready for the next focus sprint?');
        }

        document.getElementById('btn-pomo-start')?.classList.remove('hidden');
        document.getElementById('btn-pomo-pause')?.classList.add('hidden');
        updatePomodoroDisplay();
      }
    }, 1000);
  }

  function pausePomodoro() {
    if (!isPomoRunning) return;
    isPomoRunning = false;
    clearInterval(pomoTimer);
    document.getElementById('btn-pomo-start')?.classList.remove('hidden');
    document.getElementById('btn-pomo-pause')?.classList.add('hidden');
  }

  function resetPomodoro() {
    pausePomodoro();
    pomoMode = 'focus';
    pomoSecondsLeft = examStudyState.pomodoro.durationMinutes * 60;
    updatePomodoroDisplay();
  }

  // -------------------------------------------------------------
  // 7. MODALS (AI GENERATOR, NODE EDITOR, SESSION EDITOR)
  // -------------------------------------------------------------
  function openAiGeneratorModal() {
    const modal = document.getElementById('modal-ai-generator');
    if (!modal) return;

    // Prepopulate exam date (7 days ahead)
    const dateInput = document.getElementById('ai-input-exam-date') as HTMLInputElement;
    if (dateInput && !dateInput.value) {
      dateInput.value = examStudyState.targetDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
    }

    // Prepopulate subjects from enrolled attendance
    const subjectsInput = document.getElementById('ai-input-subjects') as HTMLTextAreaElement;
    if (subjectsInput && !subjectsInput.value.trim()) {
      const attendance = getAttendanceSubjects();
      if (attendance && attendance.length > 0) {
        const enrolledNames = Array.from(new Set(attendance.map(a => a.name)));
        subjectsInput.value = enrolledNames.join('\n');
      } else {
        subjectsInput.value = 'Engineering Physics\nBasic Civil Engineering\nCampus Recruitment Training';
      }
    }

    modal.classList.remove('hidden');
  }

  function openEditNodeModal(node?: FlowchartNode) {
    const modal = document.getElementById('modal-edit-node');
    if (!modal) return;

    const idInput = document.getElementById('node-form-id') as HTMLInputElement;
    const titleInput = document.getElementById('node-form-title') as HTMLInputElement;
    const subInput = document.getElementById('node-form-subject') as HTMLInputElement;
    const phaseSelect = document.getElementById('node-form-phase') as HTMLSelectElement;
    const hoursInput = document.getElementById('node-form-hours') as HTMLInputElement;
    const prioSelect = document.getElementById('node-form-priority') as HTMLSelectElement;
    const statusSelect = document.getElementById('node-form-status') as HTMLSelectElement;
    const notesInput = document.getElementById('node-form-notes') as HTMLTextAreaElement;
    const connectsSelect = document.getElementById('node-form-connects') as HTMLSelectElement;
    const delBtn = document.getElementById('btn-delete-node');

    // Populate connects options
    if (connectsSelect) {
      let opts = '';
      examStudyState.nodes.forEach(n => {
        if (!node || n.id !== node.id) {
          const isSelected = node && (node.connectsTo || []).includes(n.id);
          opts += `<option value="${n.id}" ${isSelected ? 'selected' : ''}>${n.subject}: ${n.title}</option>`;
        }
      });
      connectsSelect.innerHTML = opts;
    }

    if (node) {
      document.getElementById('modal-node-title')!.textContent = 'Edit Topic Node';
      idInput.value = node.id;
      titleInput.value = node.title;
      subInput.value = node.subject;
      phaseSelect.value = node.phase;
      hoursInput.value = String(node.estimatedHours);
      prioSelect.value = node.priority;
      statusSelect.value = node.status;
      notesInput.value = node.notes || '';
      delBtn?.classList.remove('hidden');
    } else {
      document.getElementById('modal-node-title')!.textContent = 'Add Topic Node';
      idInput.value = '';
      titleInput.value = '';
      subInput.value = examStudyState.nodes[0]?.subject || 'Engineering Physics';
      phaseSelect.value = 'phase1_fundamentals';
      hoursInput.value = '3.0';
      prioSelect.value = 'medium';
      statusSelect.value = 'todo';
      notesInput.value = '';
      delBtn?.classList.add('hidden');
    }

    modal.classList.remove('hidden');
  }

  function openEditSlotModal() {
    const modal = document.getElementById('modal-edit-slot');
    if (!modal) return;
    const idInput = document.getElementById('slot-form-id') as HTMLInputElement;
    const subInput = document.getElementById('slot-form-subject') as HTMLInputElement;
    const topicInput = document.getElementById('slot-form-topic') as HTMLInputElement;

    idInput.value = '';
    subInput.value = examStudyState.nodes[0]?.subject || 'Engineering Physics';
    topicInput.value = '';

    modal.classList.remove('hidden');
  }

  function saveExamState() {
    examStudyState.lastUpdated = new Date().toISOString();
    setStoredData(KEYS.EXAM_STUDY, examStudyState);
  }

  // -------------------------------------------------------------
  // 8. EVENT ATTACHMENTS
  // -------------------------------------------------------------
  function attachEventListeners() {
    // Top Action buttons
    document.getElementById('btn-open-ai-generator')?.addEventListener('click', openAiGeneratorModal);
    document.getElementById('btn-close-ai-modal')?.addEventListener('click', () => {
      document.getElementById('modal-ai-generator')?.classList.add('hidden');
    });
    document.getElementById('btn-cancel-ai')?.addEventListener('click', () => {
      document.getElementById('modal-ai-generator')?.classList.add('hidden');
    });

    document.getElementById('btn-add-node-manual')?.addEventListener('click', () => openEditNodeModal());
    document.getElementById('btn-close-node-modal')?.addEventListener('click', () => {
      document.getElementById('modal-edit-node')?.classList.add('hidden');
    });
    document.getElementById('btn-cancel-node')?.addEventListener('click', () => {
      document.getElementById('modal-edit-node')?.classList.add('hidden');
    });

    // Blank canvas from scratch
    document.getElementById('btn-scratch-flowchart')?.addEventListener('click', () => {
      if (confirm('Create a blank canvas from scratch? This clears existing flowchart topics so you can design your plan manually.')) {
        examStudyState.nodes = [];
        examStudyState.timetable = [];
        saveExamState();
        renderFlowchart();
        renderTimetable();
        updateCountdownAndMetrics();
        renderSubjectFilterPills();
      }
    });

    // Sync TCS Courses
    document.getElementById('btn-sync-tcs-subjects')?.addEventListener('click', () => {
      const attendance = getAttendanceSubjects();
      if (!attendance || attendance.length === 0) {
        alert('No courses found in TCS iON Attendance. Please sync your attendance first.');
        return;
      }
      const subjects = Array.from(new Set(attendance.map(a => a.name)));
      openAiGeneratorModal();
      const subjectsInput = document.getElementById('ai-input-subjects') as HTMLTextAreaElement;
      if (subjectsInput) subjectsInput.value = subjects.join('\n');
    });

    // Sub-view tabs
    document.querySelectorAll('.exam-subview-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const view = tab.getAttribute('data-subview') as any;
        if (view) switchExamSubview(view);
      });
    });

    // Flowchart toolbar
    document.getElementById('btn-flowchart-auto-layout')?.addEventListener('click', autoLayoutFlowchart);
    document.getElementById('btn-flowchart-export')?.addEventListener('click', () => {
      const json = JSON.stringify(examStudyState, null, 2);
      navigator.clipboard.writeText(json).then(() => {
        alert('🎉 Copied full Exam Flowchart & Timetable JSON backup to clipboard!');
      });
    });

    // Timetable Actions
    document.getElementById('btn-add-timetable-slot')?.addEventListener('click', openEditSlotModal);
    document.getElementById('btn-close-slot-modal')?.addEventListener('click', () => {
      document.getElementById('modal-edit-slot')?.classList.add('hidden');
    });
    document.getElementById('btn-cancel-slot')?.addEventListener('click', () => {
      document.getElementById('modal-edit-slot')?.classList.add('hidden');
    });

    // Pomodoro Controls
    document.getElementById('btn-pomo-start')?.addEventListener('click', startPomodoro);
    document.getElementById('btn-pomo-pause')?.addEventListener('click', pausePomodoro);
    document.getElementById('btn-pomo-reset')?.addEventListener('click', resetPomodoro);
    document.getElementById('btn-pomo-skip')?.addEventListener('click', () => {
      pomoSecondsLeft = 0;
      updatePomodoroDisplay();
    });

    // AI Import from TCS Button inside AI Modal
    document.getElementById('btn-ai-import-tcs')?.addEventListener('click', () => {
      const attendance = getAttendanceSubjects();
      if (attendance && attendance.length > 0) {
        const enrolled = Array.from(new Set(attendance.map(a => a.name)));
        const ta = document.getElementById('ai-input-subjects') as HTMLTextAreaElement;
        if (ta) ta.value = enrolled.join('\n');
      } else {
        alert('No attendance subjects found. Please sync with TCS iON first.');
      }
    });

    // AI Generator Form Submit
    document.getElementById('form-ai-generator')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const examName = (document.getElementById('ai-input-exam-name') as HTMLInputElement).value.trim();
      const targetDate = (document.getElementById('ai-input-exam-date') as HTMLInputElement).value;
      const subjectsRaw = (document.getElementById('ai-input-subjects') as HTMLTextAreaElement).value;
      const dailyHours = parseFloat((document.getElementById('ai-input-daily-hours') as HTMLSelectElement).value);
      const strategy = (document.getElementById('ai-input-strategy') as HTMLSelectElement).value as any;
      const weakSub = (document.getElementById('ai-input-weak-subject') as HTMLInputElement).value.trim();
      const prompt = (document.getElementById('ai-input-custom-prompt') as HTMLInputElement).value.trim();

      const subjects = subjectsRaw.split('\n').map(s => s.trim()).filter(s => s.length > 0);

      const generated = generateAiStudyPlan({
        examName,
        targetDate,
        subjects,
        dailyHours,
        strategy,
        weakSubject: weakSub || undefined,
        customPrompt: prompt || undefined,
      });

      examStudyState = generated;
      saveExamState();
      document.getElementById('modal-ai-generator')?.classList.add('hidden');
      renderSubjectFilterPills();
      renderFlowchart();
      renderTimetable();
      startCountdownInterval();
      confetti({ particleCount: 60, spread: 70 });
    });

    // Node Form Submit
    document.getElementById('form-edit-node')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const idInput = document.getElementById('node-form-id') as HTMLInputElement;
      const title = (document.getElementById('node-form-title') as HTMLInputElement).value.trim();
      const subject = (document.getElementById('node-form-subject') as HTMLInputElement).value.trim();
      const phase = (document.getElementById('node-form-phase') as HTMLSelectElement).value as any;
      const hours = parseFloat((document.getElementById('node-form-hours') as HTMLInputElement).value);
      const priority = (document.getElementById('node-form-priority') as HTMLSelectElement).value as any;
      const status = (document.getElementById('node-form-status') as HTMLSelectElement).value as any;
      const notes = (document.getElementById('node-form-notes') as HTMLTextAreaElement).value.trim();

      const connectsSelect = document.getElementById('node-form-connects') as HTMLSelectElement;
      const connectsTo = Array.from(connectsSelect.selectedOptions).map(o => o.value);

      if (idInput.value) {
        // Edit existing
        const node = examStudyState.nodes.find(n => n.id === idInput.value);
        if (node) {
          node.title = title;
          node.subject = subject;
          node.phase = phase;
          node.estimatedHours = hours;
          node.priority = priority;
          node.status = status;
          node.notes = notes;
          node.connectsTo = connectsTo;
        }
      } else {
        // Add new
        const newNode: FlowchartNode = {
          id: 'node-' + Math.random().toString(36).substring(2, 8),
          subject,
          title,
          phase,
          phaseLabel: phase.replace('phase', 'Phase '),
          status,
          estimatedHours: hours,
          priority,
          notes,
          connectsTo,
          x: 40 + Math.floor(Math.random() * 200),
          y: 40 + Math.floor(Math.random() * 200),
          isCustom: true,
        };
        examStudyState.nodes.push(newNode);
      }

      saveExamState();
      document.getElementById('modal-edit-node')?.classList.add('hidden');
      renderSubjectFilterPills();
      renderFlowchart();
      updateCountdownAndMetrics();
    });

    // Delete Node button inside edit modal
    document.getElementById('btn-delete-node')?.addEventListener('click', () => {
      const idInput = document.getElementById('node-form-id') as HTMLInputElement;
      if (idInput.value && confirm('Delete this topic node?')) {
        deleteNode(idInput.value);
        document.getElementById('modal-edit-node')?.classList.add('hidden');
      }
    });

    // Slot Form Submit
    document.getElementById('form-edit-slot')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const subject = (document.getElementById('slot-form-subject') as HTMLInputElement).value.trim();
      const topic = (document.getElementById('slot-form-topic') as HTMLInputElement).value.trim();
      const timeRange = (document.getElementById('slot-form-time') as HTMLInputElement).value.trim();
      const hours = parseFloat((document.getElementById('slot-form-hours') as HTMLInputElement).value);

      const firstActive = examStudyState.timetable.find(s => s.dayIndex === activeTimetableDay);
      const newSlot: TimetableSlot = {
        id: 'slot-' + Math.random().toString(36).substring(2, 8),
        dayIndex: activeTimetableDay,
        dayName: firstActive ? firstActive.dayName : 'Study Day',
        dateStr: firstActive ? firstActive.dateStr : new Date().toISOString().split('T')[0],
        slotName: 'morning',
        timeRange,
        subject,
        topic,
        targetHours: hours,
        completed: false,
      };

      examStudyState.timetable.push(newSlot);
      saveExamState();
      document.getElementById('modal-edit-slot')?.classList.add('hidden');
      renderTimetable();
      updateCountdownAndMetrics();
    });
  }

  // Initial Run
  attachEventListeners();
  renderSubjectFilterPills();
  startCountdownInterval();
  renderFlowchart();
}
