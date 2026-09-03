import type { AttendanceSubject } from './types';

export interface BunkAnalysis {
  percentage: number;
  isSafe: boolean;
  safeBunks: number;
  requiredClasses: number;
  statusText: string;
  statusColor: 'emerald' | 'amber' | 'rose';
}

/**
 * Calculates 75% attendance metrics accurately:
 * - Safe bunks: floor((attended - 0.75 * total) / 0.75)
 * - Required classes to reach 75%: ceil((0.75 * total - attended) / (1 - 0.75))
 */
export function calculateBunkStats(attended: number, total: number, target: number = 75): BunkAnalysis {
  if (total === 0) {
    return {
      percentage: 100,
      isSafe: true,
      safeBunks: 0,
      requiredClasses: 0,
      statusText: 'No classes held yet',
      statusColor: 'emerald',
    };
  }

  const percentage = Number(((attended / total) * 100).toFixed(1));
  const targetFraction = target / 100;

  if (percentage >= target) {
    // How many future classes can we miss and still have percentage >= target?
    // attended / (total + x) >= targetFraction => x <= (attended - targetFraction * total) / targetFraction
    const safeBunks = Math.max(0, Math.floor((attended - targetFraction * total) / targetFraction));
    return {
      percentage,
      isSafe: true,
      safeBunks,
      requiredClasses: 0,
      statusText: safeBunks > 0 ? `Can safely bunk ${safeBunks} more class${safeBunks > 1 ? 'es' : ''}` : 'On the edge (0 bunks allowed)',
      statusColor: 'emerald',
    };
  } else {
    // How many consecutive classes must we attend?
    // (attended + y) / (total + y) >= targetFraction => y >= (targetFraction * total - attended) / (1 - targetFraction)
    const required = Math.max(1, Math.ceil((targetFraction * total - attended) / (1 - targetFraction)));
    return {
      percentage,
      isSafe: false,
      safeBunks: 0,
      requiredClasses: required,
      statusText: `Must attend next ${required} consecutive class${required > 1 ? 'es' : ''}`,
      statusColor: percentage < 65 ? 'rose' : 'amber',
    };
  }
}

/**
 * Parses raw text copied from TCS iON attendance portal or LMS tables
 */
export function parseTcsIonText(rawText: string): AttendanceSubject[] {
  const lines = rawText.trim().split(/\r?\n/);
  const results: AttendanceSubject[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Pattern 1: Tab or multi-space separated values: [Code, Name, Attended, Total, Percentage]
    const parts = line.split(/\t|\s{2,}/);
    if (parts.length >= 3) {
      const numbers = parts.map(p => parseInt(p, 10)).filter(n => !isNaN(n));
      if (numbers.length >= 2) {
        // e.g. "CS301 Data Structures", 28, 32
        const namePart = parts[0];
        const attended = numbers[0];
        const total = numbers[1];
        if (total >= attended && total > 0) {
          results.push({
            id: 'sub-' + Math.random().toString(36).substring(2, 8),
            code: namePart.substring(0, 8).trim(),
            name: namePart.replace(/^[A-Z0-9-]+\s*/, '').trim() || namePart,
            attended,
            total,
            type: namePart.toLowerCase().includes('lab') ? 'Lab' : 'Lecture',
          });
          continue;
        }
      }
    }

    // Pattern 2: Regex searching for subject patterns with numbers (e.g. "Operating Systems 19/27" or "DBMS: 22 out of 28")
    const match = line.match(/(.+?)\s*[:|-]?\s*(\d+)\s*(?:\/|\s+out of\s+|\s+of\s+)\s*(\d+)/i);
    if (match) {
      const name = match[1].replace(/^[0-9]+[.)\s]*/, '').trim();
      const attended = parseInt(match[2], 10);
      const total = parseInt(match[3], 10);
      if (total >= attended && total > 0) {
        results.push({
          id: 'sub-' + Math.random().toString(36).substring(2, 8),
          code: 'SUB' + (results.length + 1),
          name,
          attended,
          total,
          type: name.toLowerCase().includes('lab') ? 'Lab' : 'Lecture',
        });
      }
    }
  }

  return results;
}

/**
 * 1-Click Bookmarklet script generator for TCS iON Portal
 * When clicked on the TCS iON attendance tab, it scrapes the live DOM table and copies structured JSON
 * or opens the College Companion app with the data in URL hash.
 */
export function generateTcsBookmarkletCode(): string {
  const script = `javascript:(function(){
    try {
      var rows = document.querySelectorAll('table tr, .grid-row, .table-row');
      var data = [];
      rows.forEach(function(r) {
        var cells = Array.from(r.querySelectorAll('td, th, .grid-cell')).map(function(c){ return c.innerText.trim(); });
        if(cells.length >= 3) {
          var nums = cells.map(function(c){ return parseInt(c, 10); }).filter(function(n){ return !isNaN(n); });
          if(nums.length >= 2) {
            data.push({
              name: cells[0] || 'Subject',
              attended: nums[0],
              total: nums[1]
            });
          }
        }
      });
      if(data.length === 0) {
        alert('Could not find attendance table. Please navigate to the TCS iON Attendance View page first.');
        return;
      }
      var json = JSON.stringify(data);
      navigator.clipboard.writeText(json).then(function() {
        alert('🎉 Copied ' + data.length + ' subjects from TCS iON! Go back to College Companion and click "Paste Extracted Data"');
      }).catch(function() {
        prompt('Copy this JSON into your College Companion app:', json);
      });
    } catch(err) {
      alert('Error extracting attendance: ' + err.message);
    }
  })();`;
  return script.replace(/\s+/g, ' ').trim();
}
