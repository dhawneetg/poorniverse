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
 * Parses raw text or JSON copied from TCS iON attendance portal (Cards, Tables, or JSON)
 */
export function parseTcsIonText(rawText: string): AttendanceSubject[] {
  const trimmed = rawText.trim();
  if (!trimmed) return [];

  // -------------------------------------------------------------
  // Format 1: Structured JSON (Copied by TCS iON Chrome Extension)
  // -------------------------------------------------------------
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item, idx) => {
          const name = (item.name || item.subject || `Course ${idx + 1}`).trim();
          const code = (item.code || `SUB${idx + 1}`).trim();
          const attended = Number(item.attended) || 0;
          const total = Number(item.total) || 0;
          const type = item.type || (name.toLowerCase().includes('lab') ? 'Lab' : 'Lecture');

          return {
            id: 'sub-' + Math.random().toString(36).substring(2, 8),
            code,
            name,
            attended,
            total,
            type,
            lastUpdated: new Date().toISOString(),
          };
        }).filter(s => s.total >= s.attended && s.total > 0);
      }
    } catch (e) {
      // If JSON parsing fails, fall through to text parsing
    }
  }

  const results: AttendanceSubject[] = [];
  const seenKeys = new Set<string>();

  // -------------------------------------------------------------
  // Format 2: Card Layout Copy-Paste (Modern TCS iON Semester View)
  // Blocks containing "Total Lectures" and "Present"
  // -------------------------------------------------------------
  const cardBlockRegex = /([A-Za-z0-9\s()&,.-]{3,50})[\r\n]+([A-Z0-9-]{4,15})[\s\S]*?Total\s*(?:Lectures|Classes)?\s*[:\s]*(\d+)[\s\S]*?Present\s*[:\s]*(\d+)/gi;
  let cardMatch: RegExpExecArray | null;

  while ((cardMatch = cardBlockRegex.exec(trimmed)) !== null) {
    const rawName = cardMatch[1].trim();
    const code = cardMatch[2].trim();
    const total = parseInt(cardMatch[3], 10);
    const attended = parseInt(cardMatch[4], 10);

    // Clean name from leading junk
    const name = rawName.replace(/^(Total|Present|Absent|Activities|\d+%)\s*/i, '').trim();

    if (total >= attended && total > 0 && !seenKeys.has(code)) {
      seenKeys.add(code);
      results.push({
        id: 'sub-' + Math.random().toString(36).substring(2, 8),
        code,
        name: name || code,
        attended,
        total,
        type: (name.toLowerCase().includes('lab') || cardMatch[0].toLowerCase().includes('practical')) ? 'Lab' : 'Lecture',
        lastUpdated: new Date().toISOString(),
      });
    }
  }

  if (results.length > 0) {
    return results;
  }

  // -------------------------------------------------------------
  // Format 3: Line-by-Line Tables or Formatted Text
  // -------------------------------------------------------------
  const lines = trimmed.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Pattern 3A: Tab or multi-space separated: [Code/Name, Attended, Total, ...]
    const parts = line.split(/\t|\s{2,}/);
    if (parts.length >= 3) {
      const numbers = parts.map(p => parseInt(p, 10)).filter(n => !isNaN(n));
      if (numbers.length >= 2) {
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
            lastUpdated: new Date().toISOString(),
          });
          continue;
        }
      }
    }

    // Pattern 3B: Regex searching for subject with "19/27" or "22 out of 28"
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
          lastUpdated: new Date().toISOString(),
        });
      }
    }
  }

  return results;
}

/**
 * 1-Click Bookmarklet script generator for TCS iON Portal
 * Supports both modern Card view and legacy Table view
 */
export function generateTcsBookmarkletCode(): string {
  const script = `javascript:(function(){
    try {
      var data = [];
      var seen = {};

      // 1. Check card elements
      var all = document.querySelectorAll('*');
      for(var i=0; i<all.length; i++){
        var el = all[i];
        var txt = el.innerText || '';
        if(txt.indexOf('Total Lectures') !== -1 && txt.indexOf('Present') !== -1){
          var isDeep = true;
          for(var j=0; j<el.children.length; j++){
            if((el.children[j].innerText||'').indexOf('Total Lectures') !== -1){ isDeep = false; break; }
          }
          if(isDeep && txt.length < 1500 && txt.length > 30){
            var totM = txt.match(/Total\\s*(?:Lectures|Classes)?\\s*[:\\s]*(\\d+)/i);
            var preM = txt.match(/Present\\s*[:\\s]*(\\d+)/i);
            if(totM && preM){
              var tot = parseInt(totM[1], 10);
              var att = parseInt(preM[1], 10);
              var codM = txt.match(/\\b([0-9]{3}[A-Z]{2,3}[0-9]-[0-9]+|[A-Z]{2,6}[0-9]{2,4}|[A-Z0-9-]{5,15})\\b/);
              var code = codM ? codM[1] : ('SUB' + (data.length + 1));
              var lines = txt.split(/\\r?\\n/).filter(function(l){ return l.trim().length > 0; });
              var name = lines[0] || 'Course';
              if(tot >= att && tot > 0 && !seen[code]){
                seen[code] = true;
                data.push({ code: code, name: name, attended: att, total: tot, type: (name.toLowerCase().indexOf('lab')!==-1||txt.indexOf('Practical')!==-1)?'Lab':'Lecture' });
              }
            }
          }
        }
      }

      // 2. Fallback table rows
      if(data.length === 0){
        var rows = document.querySelectorAll('table tr, .grid-row, .table-row');
        rows.forEach(function(r) {
          var cells = Array.from(r.querySelectorAll('td, th, .grid-cell')).map(function(c){ return c.innerText.trim(); });
          if(cells.length >= 3) {
            var nums = cells.map(function(c){ return parseInt(c, 10); }).filter(function(n){ return !isNaN(n); });
            if(nums.length >= 2) {
              data.push({ code: (cells[0]||'SUB').substring(0,8), name: cells[0] || 'Subject', attended: nums[0], total: nums[1], type: (cells[0]||'').toLowerCase().indexOf('lab')!==-1?'Lab':'Lecture' });
            }
          }
        });
      }

      if(data.length === 0) {
        alert('Could not find attendance data. Please make sure you are on the TCS iON "Semester View" Attendance page.');
        return;
      }

      var json = JSON.stringify(data);
      navigator.clipboard.writeText(json).then(function() {
        alert('🎉 Copied ' + data.length + ' subjects from TCS iON! Switch back to Poornima Companion and click "Paste Extracted Data"');
      }).catch(function() {
        prompt('Copy this JSON into your College Companion app:', json);
      });
    } catch(err) {
      alert('Error extracting attendance: ' + err.message);
    }
  })();`;
  return script.replace(/\s+/g, ' ').trim();
}
