import type { ExamStudyState, FlowchartNode, TimetableSlot } from './types';

// Default initial state tailored for B.Tech engineering student exams next week
export const DEFAULT_EXAM_STUDY: ExamStudyState = {
  examName: 'Mid-Term 1 Examinations',
  targetDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0], // 7 days from now (next week)
  dailyStudyHours: 6,
  strategy: 'high_yield_pyq',
  focusSubjects: ['Engineering Physics', 'Basic Civil Engineering'],
  nodes: [
    // --- Phase 1: Core Fundamentals & High-Yield Units ---
    {
      id: 'node-phy-u1',
      subject: 'Engineering Physics',
      title: 'Unit 1: Wave Optics (Interference & Diffraction)',
      phase: 'phase1_fundamentals',
      phaseLabel: '1. Core Theory',
      status: 'mastered',
      estimatedHours: 3.0,
      priority: 'high',
      notes: 'Focus on Newton rings derivation & single-slit diffraction condition.',
      connectsTo: ['node-phy-u2', 'node-phy-prac'],
      x: 40,
      y: 60,
    },
    {
      id: 'node-phy-u2',
      subject: 'Engineering Physics',
      title: 'Unit 2: Quantum Mechanics & Schrodinger Eq',
      phase: 'phase1_fundamentals',
      phaseLabel: '1. Core Theory',
      status: 'in_progress',
      estimatedHours: 3.5,
      priority: 'high',
      notes: 'Time-independent wave equation & particle in a 1D box.',
      connectsTo: ['node-phy-prac'],
      x: 40,
      y: 220,
    },
    {
      id: 'node-civil-u1',
      subject: 'Basic Civil Engineering',
      title: 'Unit 1: Building Materials, Cement & Concrete',
      phase: 'phase1_fundamentals',
      phaseLabel: '1. Core Theory',
      status: 'mastered',
      estimatedHours: 2.5,
      priority: 'medium',
      notes: 'Constituents of OPC, concrete grades, and compressive strength tests.',
      connectsTo: ['node-civil-u2'],
      x: 40,
      y: 380,
    },
    {
      id: 'node-civil-u2',
      subject: 'Basic Civil Engineering',
      title: 'Unit 2: Chain & Compass Surveying',
      phase: 'phase1_fundamentals',
      phaseLabel: '1. Core Theory',
      status: 'todo',
      estimatedHours: 3.0,
      priority: 'high',
      notes: 'Fore bearing, back bearing, local attraction numerical correction.',
      connectsTo: ['node-civil-prac'],
      x: 40,
      y: 540,
    },
    {
      id: 'node-crt-u1',
      subject: 'Campus Recruitment Training',
      title: 'Quantitative Aptitude: P&C and Probability',
      phase: 'phase1_fundamentals',
      phaseLabel: '1. Core Theory',
      status: 'mastered',
      estimatedHours: 2.0,
      priority: 'medium',
      notes: 'Formula speed drills for campus placement assessment rounds.',
      connectsTo: ['node-crt-mock'],
      x: 40,
      y: 700,
    },

    // --- Phase 2: Numericals, Formulas & Practical Viva ---
    {
      id: 'node-phy-prac',
      subject: 'Engineering Physics',
      title: 'Physics Numericals & Formula Cheat Sheet',
      phase: 'phase2_practice',
      phaseLabel: '2. Practice & Lab',
      status: 'in_progress',
      estimatedHours: 3.0,
      priority: 'high',
      notes: 'Solve numericals on grating resolving power and De Broglie wavelength.',
      connectsTo: ['node-phy-pyq'],
      x: 320,
      y: 140,
    },
    {
      id: 'node-civil-prac',
      subject: 'Basic Civil Engineering',
      title: 'Surveying Numericals & Leveling Calculations',
      phase: 'phase2_practice',
      phaseLabel: '2. Practice & Lab',
      status: 'todo',
      estimatedHours: 3.0,
      priority: 'high',
      notes: 'Height of Instrument (HI) & Rise and Fall reduction tables.',
      connectsTo: ['node-civil-pyq'],
      x: 320,
      y: 460,
    },

    // --- Phase 3: Previous Year Questions (PYQs) ---
    {
      id: 'node-phy-pyq',
      subject: 'Engineering Physics',
      title: 'Last 3 Years Poornima / RTU Mid-Term PYQs',
      phase: 'phase3_pyqs',
      phaseLabel: '3. PYQ Mastery',
      status: 'todo',
      estimatedHours: 4.0,
      priority: 'high',
      notes: 'Solve 2023, 2024, 2025 question papers under 1-hour time limits.',
      connectsTo: ['node-phy-mock'],
      x: 600,
      y: 140,
    },
    {
      id: 'node-civil-pyq',
      subject: 'Basic Civil Engineering',
      title: 'Civil Engineering Previous Papers & Short Answers',
      phase: 'phase3_pyqs',
      phaseLabel: '3. PYQ Mastery',
      status: 'todo',
      estimatedHours: 3.5,
      priority: 'high',
      notes: 'Repeated 5-mark theory questions: foundations, brick masonry bonds.',
      connectsTo: ['node-civil-mock'],
      x: 600,
      y: 460,
    },
    {
      id: 'node-crt-mock',
      subject: 'Campus Recruitment Training',
      title: 'CRT Speed Assessment Drill & Coding Logic',
      phase: 'phase3_pyqs',
      phaseLabel: '3. PYQ Mastery',
      status: 'todo',
      estimatedHours: 2.0,
      priority: 'medium',
      notes: '30-minute timed mock test on logic and basic algorithmic thinking.',
      connectsTo: ['node-final-review'],
      x: 600,
      y: 700,
    },

    // --- Phase 4: Full Revision & Mock Exam Simulation ---
    {
      id: 'node-phy-mock',
      subject: 'Engineering Physics',
      title: 'Physics Full Mock Exam & Error Analysis',
      phase: 'phase4_mock_revision',
      phaseLabel: '4. Mock & Final',
      status: 'todo',
      estimatedHours: 2.5,
      priority: 'high',
      notes: 'Simulate exact exam conditions (20 marks Mid-Term paper).',
      connectsTo: ['node-final-review'],
      x: 880,
      y: 140,
    },
    {
      id: 'node-civil-mock',
      subject: 'Basic Civil Engineering',
      title: 'Civil Full Mock Exam & Diagram Practice',
      phase: 'phase4_mock_revision',
      phaseLabel: '4. Mock & Final',
      status: 'todo',
      estimatedHours: 2.5,
      priority: 'high',
      notes: 'Practice neat labeled sketches of theodolite and road cross-section.',
      connectsTo: ['node-final-review'],
      x: 880,
      y: 460,
    },
    {
      id: 'node-final-review',
      subject: 'All Subjects',
      title: 'Exam Eve Flashcard & Key Formulas Recap',
      phase: 'phase4_mock_revision',
      phaseLabel: '4. Mock & Final',
      status: 'todo',
      estimatedHours: 2.0,
      priority: 'high',
      notes: 'Final confidence revision before day of examination.',
      connectsTo: [],
      x: 1140,
      y: 350,
    },
  ],
  timetable: generateDefaultTimetable(7),
  pomodoro: {
    durationMinutes: 25,
    breakMinutes: 5,
    activeSubject: 'Engineering Physics',
    activeNodeId: 'node-phy-u2',
    totalMinutesLogged: 85,
  },
  lastUpdated: new Date().toISOString(),
};

/**
 * Generates an initial day-by-day timetable for the specified number of days
 */
function generateDefaultTimetable(numDays: number = 7): TimetableSlot[] {
  const slots: TimetableSlot[] = [];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = new Date();

  const slotTemplates = [
    { name: 'morning' as const, timeRange: '09:00 AM - 11:30 AM', targetHours: 2.5 },
    { name: 'afternoon' as const, timeRange: '02:00 PM - 04:30 PM', targetHours: 2.5 },
    { name: 'evening' as const, timeRange: '06:00 PM - 08:00 PM', targetHours: 2.0 },
    { name: 'night' as const, timeRange: '09:30 PM - 10:45 PM', targetHours: 1.25 },
  ];

  const planSequence = [
    // Day 0: Today
    [
      { subject: 'Engineering Physics', topic: 'Unit 1: Interference & Newton Rings Derivations', nodeId: 'node-phy-u1', completed: true },
      { subject: 'Basic Civil Engineering', topic: 'Unit 1: Cement, Mortar & Concrete Grades', nodeId: 'node-civil-u1', completed: true },
      { subject: 'Campus Recruitment Training', topic: 'P&C and Quantitative Formula Drills', nodeId: 'node-crt-u1', completed: true },
      { subject: 'Engineering Physics', topic: 'Unit 2: Quantum Wave Equation & Particle in Box', nodeId: 'node-phy-u2', completed: false },
    ],
    // Day 1: Tomorrow
    [
      { subject: 'Engineering Physics', topic: 'Physics Numericals: Grating & Resolving Power', nodeId: 'node-phy-prac', completed: false },
      { subject: 'Basic Civil Engineering', topic: 'Unit 2: Compass Surveying & Local Attraction', nodeId: 'node-civil-u2', completed: false },
      { subject: 'Engineering Physics', topic: 'Lasers & Optical Fibers Key Formulas', nodeId: 'node-phy-u2', completed: false },
      { subject: 'All Subjects', topic: 'Spaced Recall & 30-min Flashcard Review', nodeId: 'node-phy-prac', completed: false },
    ],
    // Day 2
    [
      { subject: 'Basic Civil Engineering', topic: 'Height of Instrument & Leveling Table Problems', nodeId: 'node-civil-prac', completed: false },
      { subject: 'Engineering Physics', topic: 'Solve Mid-Term 2023 Past Year Paper (PYQ)', nodeId: 'node-phy-pyq', completed: false },
      { subject: 'Campus Recruitment Training', topic: 'Timed Aptitude & Coding Logic Test', nodeId: 'node-crt-mock', completed: false },
      { subject: 'Basic Civil Engineering', topic: 'Civil Unit 1 & 2 Rapid Self-Quiz', nodeId: 'node-civil-prac', completed: false },
    ],
    // Day 3
    [
      { subject: 'Engineering Physics', topic: 'Solve Mid-Term 2024 Past Year Paper (PYQ)', nodeId: 'node-phy-pyq', completed: false },
      { subject: 'Basic Civil Engineering', topic: 'Civil Engineering 2023-2024 PYQ Long Answers', nodeId: 'node-civil-pyq', completed: false },
      { subject: 'Engineering Physics', topic: 'Revise Weak Topics & Numerical Edge Cases', nodeId: 'node-phy-prac', completed: false },
      { subject: 'All Subjects', topic: 'Night Formula Sheet Writing', nodeId: 'node-final-review', completed: false },
    ],
    // Day 4
    [
      { subject: 'Basic Civil Engineering', topic: 'Road Cross-Sections & Soil Mechanics Terms', nodeId: 'node-civil-pyq', completed: false },
      { subject: 'Engineering Physics', topic: 'Full Physics Timed Mock Paper (1 Hour)', nodeId: 'node-phy-mock', completed: false },
      { subject: 'Basic Civil Engineering', topic: 'Civil Engineering Mock Paper (1 Hour)', nodeId: 'node-civil-mock', completed: false },
      { subject: 'Engineering Physics', topic: 'Analyze Mock Test Mistakes & Correction', nodeId: 'node-phy-mock', completed: false },
    ],
    // Day 5
    [
      { subject: 'Engineering Physics', topic: 'Physics Unit 1-3 Ultra-Fast Derivation Run', nodeId: 'node-phy-mock', completed: false },
      { subject: 'Basic Civil Engineering', topic: 'Civil Surveying Diagrams & Formulas Review', nodeId: 'node-civil-mock', completed: false },
      { subject: 'Campus Recruitment Training', topic: 'CRT General Awareness & Technical Recap', nodeId: 'node-crt-mock', completed: false },
      { subject: 'All Subjects', topic: 'Light Review & Early Bedtime Schedule', nodeId: 'node-final-review', completed: false },
    ],
    // Day 6: Exam Eve
    [
      { subject: 'Engineering Physics', topic: 'Final Cheat Sheet Review (Formulas only)', nodeId: 'node-final-review', completed: false },
      { subject: 'Basic Civil Engineering', topic: 'Final Rapid Summary & Definitions Review', nodeId: 'node-final-review', completed: false },
      { subject: 'All Subjects', topic: 'Admit Card, Stationery, & Calculator Prep', nodeId: 'node-final-review', completed: false },
      { subject: 'All Subjects', topic: 'Rest & Mental Readiness for Tomorrow\'s Exam', nodeId: 'node-final-review', completed: false },
    ],
  ];

  for (let d = 0; d < numDays; d++) {
    const curDate = new Date(today.getTime() + d * 86400000);
    const dateStr = curDate.toISOString().split('T')[0];
    const dayName = dayNames[curDate.getDay()];
    const dayPlan = planSequence[d % planSequence.length];

    slotTemplates.forEach((slot, slotIdx) => {
      const planItem = dayPlan[slotIdx] || {
        subject: 'General Study',
        topic: 'Concept Review & Problem Practice',
        nodeId: undefined,
        completed: false,
      };

      slots.push({
        id: `slot-d${d}-s${slotIdx}`,
        dayIndex: d,
        dayName,
        dateStr,
        slotName: slot.name,
        timeRange: slot.timeRange,
        subject: planItem.subject,
        topic: planItem.topic,
        targetHours: slot.targetHours,
        nodeId: planItem.nodeId,
        completed: planItem.completed || false,
      });
    });
  }

  return slots;
}

/**
 * AI Study Plan & Flowchart Generator
 * Generates an intelligent, spaced-repetition flowchart and daily timetable
 * according to user's subjects, exam date, daily hours, strategy, and custom prompts.
 */
export function generateAiStudyPlan(params: {
  examName: string;
  targetDate: string;
  subjects: string[];
  dailyHours: number;
  strategy: 'balanced' | 'high_yield_pyq' | 'cram_revision';
  weakSubject?: string;
  customPrompt?: string;
}): ExamStudyState {
  const {
    examName = 'Upcoming Examinations',
    targetDate,
    subjects = ['Engineering Physics', 'Basic Civil Engineering'],
    dailyHours = 6,
    strategy = 'high_yield_pyq',
    weakSubject,
    customPrompt,
  } = params;

  // Calculate days remaining
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exam = new Date(targetDate);
  exam.setHours(0, 0, 0, 0);
  const diffDays = Math.max(1, Math.min(30, Math.round((exam.getTime() - today.getTime()) / 86400000)));

  // Clean subject list
  const cleanSubjects = subjects.length > 0 ? subjects : ['Engineering Physics', 'Basic Civil Engineering', 'Mathematics'];
  const nodes: FlowchartNode[] = [];
  const timetable: TimetableSlot[] = [];

  // Subject syllabus curriculum templates
  const syllabusDatabase: Record<string, { u1: string; u2: string; numericals: string; pyq: string; mock: string }> = {
    'Engineering Physics': {
      u1: 'Unit 1: Wave Optics & Interference (Newton Rings)',
      u2: 'Unit 2: Quantum Mechanics & Wave Equations',
      numericals: 'Diffraction Grating & Laser Numericals',
      pyq: 'Past 3 Years Physics Exam Papers & Derivations',
      mock: 'Full Timed Physics Mock Paper (20 Marks)',
    },
    'Basic Civil Engineering': {
      u1: 'Unit 1: Cement, Mortar, Concrete & Masonry',
      u2: 'Unit 2: Chain & Compass Surveying Angles',
      numericals: 'Leveling Tables & HI Method Numericals',
      pyq: 'Civil Engineering Previous Year Exam Papers',
      mock: 'Civil Diagrams & Written Mock Test',
    },
    'Campus Recruitment Training': {
      u1: 'Quantitative Aptitude: P&C and Probability',
      u2: 'Logical Reasoning: Syllogisms & Seating',
      numericals: 'Speed Mathematics & Formula Tricks',
      pyq: 'TCS NQT & College Placement PYQ Drills',
      mock: 'Timed 30-min Campus Test Assessment',
    },
    'Engineering Mathematics': {
      u1: 'Unit 1: Matrices, Rank, Eigenvalues & Cayley',
      u2: 'Unit 2: Differential Calculus & Mean Value',
      numericals: 'Matrix Diagonalization & Integration Drills',
      pyq: 'RTU / Poornima Math Exam PYQs',
      mock: 'Full Mathematics 2-Hour Mock Test',
    },
    'Computer Programming': {
      u1: 'Unit 1: C/Python Syntax, Loops & Pointers',
      u2: 'Unit 2: Arrays, Strings, Functions & Structs',
      numericals: 'Algorithm Tracing & Dry-Run Exercises',
      pyq: 'Previous Theory & Output Question Papers',
      mock: 'Code Tracing & Viva Mock Test',
    },
    'Basic Electrical Engineering': {
      u1: 'Unit 1: DC Circuits, KVL, KCL & Thevenin',
      u2: 'Unit 2: AC Circuits, Phasors & Resonance',
      numericals: 'Circuit Solving & Transformer Efficiency',
      pyq: 'Electrical Mid-Term PYQs & Definitions',
      mock: 'Full Circuit Theory Mock Paper',
    },
  };

  // Generate nodes for each subject
  let yOffset = 50;

  cleanSubjects.forEach((sub, sIdx) => {
    const isWeak = weakSubject && sub.toLowerCase().includes(weakSubject.toLowerCase());
    const hoursMultiplier = isWeak ? 1.3 : 1.0;
    const db = syllabusDatabase[sub] || {
      u1: `Unit 1: Core Fundamentals of ${sub}`,
      u2: `Unit 2: Advanced Concepts of ${sub}`,
      numericals: `${sub} Formulas & Problem Solving`,
      pyq: `${sub} Previous Year Question Papers`,
      mock: `${sub} Full Mock Exam Simulation`,
    };

    const idPrefix = `node-${sIdx}`;

    // Node 1: Theory Unit 1
    const n1: FlowchartNode = {
      id: `${idPrefix}-u1`,
      subject: sub,
      title: db.u1,
      phase: 'phase1_fundamentals',
      phaseLabel: '1. Core Theory',
      status: 'todo',
      estimatedHours: Number((2.5 * hoursMultiplier).toFixed(1)),
      priority: isWeak ? 'high' : 'medium',
      notes: `Focus on fundamental principles and standard derivations in ${sub}.`,
      connectsTo: [`${idPrefix}-u2`, `${idPrefix}-num`],
      x: 40,
      y: yOffset,
    };

    // Node 2: Theory Unit 2
    const n2: FlowchartNode = {
      id: `${idPrefix}-u2`,
      subject: sub,
      title: db.u2,
      phase: 'phase1_fundamentals',
      phaseLabel: '1. Core Theory',
      status: 'todo',
      estimatedHours: Number((3.0 * hoursMultiplier).toFixed(1)),
      priority: isWeak ? 'high' : 'medium',
      notes: `High-scoring definitions and key equations.`,
      connectsTo: [`${idPrefix}-num`],
      x: 40,
      y: yOffset + 140,
    };

    // Node 3: Practice & Numericals
    const n3: FlowchartNode = {
      id: `${idPrefix}-num`,
      subject: sub,
      title: db.numericals,
      phase: 'phase2_practice',
      phaseLabel: '2. Practice & Lab',
      status: 'todo',
      estimatedHours: Number((3.0 * hoursMultiplier).toFixed(1)),
      priority: 'high',
      notes: `Master the step-by-step problem solving methods.`,
      connectsTo: [`${idPrefix}-pyq`],
      x: 320,
      y: yOffset + 70,
    };

    // Node 4: PYQs
    const n4: FlowchartNode = {
      id: `${idPrefix}-pyq`,
      subject: sub,
      title: db.pyq,
      phase: 'phase3_pyqs',
      phaseLabel: '3. PYQ Mastery',
      status: 'todo',
      estimatedHours: Number((3.5 * hoursMultiplier).toFixed(1)),
      priority: 'high',
      notes: `80% of exam marks come from questions repeated in previous 3 years.`,
      connectsTo: [`${idPrefix}-mock`],
      x: 620,
      y: yOffset + 70,
    };

    // Node 5: Mock Test
    const n5: FlowchartNode = {
      id: `${idPrefix}-mock`,
      subject: sub,
      title: db.mock,
      phase: 'phase4_mock_revision',
      phaseLabel: '4. Mock & Final',
      status: 'todo',
      estimatedHours: 2.0,
      priority: isWeak ? 'high' : 'medium',
      notes: `Write under strictly timed exam conditions.`,
      connectsTo: ['node-final-recap'],
      x: 900,
      y: yOffset + 70,
    };

    nodes.push(n1, n2, n3, n4, n5);
    yOffset += 240;
  });

  // Final review milestone node
  nodes.push({
    id: 'node-final-recap',
    subject: 'All Subjects',
    title: 'Exam Eve Formula Sheet & Mental Readiness',
    phase: 'phase4_mock_revision',
    phaseLabel: '4. Mock & Final',
    status: 'todo',
    estimatedHours: 2.0,
    priority: 'high',
    notes: 'Last-mile confidence revision and formula memorization.',
    connectsTo: [],
    x: 1160,
    y: Math.max(150, Math.floor(yOffset / 2) - 50),
  });

  // Generate day-by-day timetable up to exam date
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const slotPresets = [
    { name: 'morning' as const, timeRange: '09:00 AM - 11:30 AM', hours: 2.5 },
    { name: 'afternoon' as const, timeRange: '02:00 PM - 04:30 PM', hours: 2.5 },
    { name: 'evening' as const, timeRange: '06:00 PM - 08:30 PM', hours: 2.5 },
    { name: 'night' as const, timeRange: '09:30 PM - 10:45 PM', hours: 1.25 },
  ];

  // Distribute nodes across days
  let nodeIdx = 0;
  for (let d = 0; d < diffDays; d++) {
    const curDate = new Date(today.getTime() + d * 86400000);
    const dateStr = curDate.toISOString().split('T')[0];
    const dayName = dayNames[curDate.getDay()];

    const isExamEve = d === diffDays - 1;

    slotPresets.forEach((slot, sIdx) => {
      let subject = cleanSubjects[(d + sIdx) % cleanSubjects.length];
      let topic = `Focus Revision & Numericals for ${subject}`;
      let linkedNodeId: string | undefined = undefined;

      if (isExamEve) {
        subject = 'All Subjects';
        topic = sIdx === 3 ? 'Early Rest & Mental Calm' : `Exam Eve Formula Sheet Revision (Slot ${sIdx + 1})`;
        linkedNodeId = 'node-final-recap';
      } else if (nodeIdx < nodes.length - 1) {
        const assignedNode = nodes[nodeIdx % (nodes.length - 1)];
        subject = assignedNode.subject;
        topic = assignedNode.title;
        linkedNodeId = assignedNode.id;
        nodeIdx++;
      }

      timetable.push({
        id: `slot-gen-d${d}-s${sIdx}`,
        dayIndex: d,
        dayName,
        dateStr,
        slotName: slot.name,
        timeRange: slot.timeRange,
        subject,
        topic,
        targetHours: slot.hours,
        nodeId: linkedNodeId,
        completed: false,
      });
    });
  }

  return {
    examName,
    targetDate,
    dailyStudyHours: dailyHours,
    strategy,
    focusSubjects: weakSubject ? [weakSubject] : cleanSubjects.slice(0, 2),
    nodes,
    timetable,
    pomodoro: {
      durationMinutes: 25,
      breakMinutes: 5,
      activeSubject: cleanSubjects[0] || 'Engineering Physics',
      activeNodeId: nodes[0]?.id,
      totalMinutesLogged: 0,
    },
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Calculates quantitative preparation metrics
 */
export function calculateStudyMetrics(state: ExamStudyState) {
  const totalNodes = state.nodes.length;
  const masteredNodes = state.nodes.filter(n => n.status === 'mastered').length;
  const inProgressNodes = state.nodes.filter(n => n.status === 'in_progress').length;
  const masteryPercentage = totalNodes > 0 ? Math.round((masteredNodes / totalNodes) * 100) : 0;

  const totalSlots = state.timetable.length;
  const completedSlots = state.timetable.filter(s => s.completed).length;
  const totalHours = state.timetable.reduce((acc, s) => acc + s.targetHours, 0);
  const completedHours = state.timetable.filter(s => s.completed).reduce((acc, s) => acc + s.targetHours, 0);

  // Time remaining until exam
  const now = new Date().getTime();
  const targetTime = new Date(state.targetDate + 'T09:00:00').getTime();
  const diffMs = Math.max(0, targetTime - now);
  const daysRemaining = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hoursRemaining = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutesRemaining = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  return {
    totalNodes,
    masteredNodes,
    inProgressNodes,
    masteryPercentage,
    totalSlots,
    completedSlots,
    totalHours: Number(totalHours.toFixed(1)),
    completedHours: Number(completedHours.toFixed(1)),
    daysRemaining,
    hoursRemaining,
    minutesRemaining,
  };
}
