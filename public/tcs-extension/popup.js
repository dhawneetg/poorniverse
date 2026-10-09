// popup.js — TCS iON Auto Sync Extension Popup (v1.1.0)
const urlInput = document.getElementById('target-url');

// Load stored target URL or default
if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
  chrome.storage.sync.get(['app_url'], (res) => {
    if (urlInput) urlInput.value = res.app_url || 'http://localhost:4321';
  });
}

if (urlInput) {
  urlInput.addEventListener('change', () => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.set({ app_url: urlInput.value.trim() });
    }
  });
}

document.getElementById('btn-sync')?.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.url || !tab.url.includes('tcsion.com')) {
    alert('Please switch to your TCS iON Attendance page tab first.');
    return;
  }

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      function extractFromDoc(doc) {
        if (!doc) return [];
        const data = [];
        const seenCodes = new Set();

        // 1. Cards (Modern TCS iON Semester View)
        try {
          const allElements = doc.querySelectorAll('*');
          const candidateCards = [];

          for (let i = 0; i < allElements.length; i++) {
            const el = allElements[i];
            const text = el.innerText || '';
            if (text.includes('Total Lectures') && text.includes('Present')) {
              let isDeepest = true;
              for (let j = 0; j < el.children.length; j++) {
                const childText = el.children[j].innerText || '';
                if (childText.includes('Total Lectures') && childText.includes('Present')) {
                  isDeepest = false;
                  break;
                }
              }
              if (isDeepest && text.length < 1500 && text.length > 30) {
                candidateCards.push(el);
              }
            }
          }

          for (let card of candidateCards) {
            const text = (card.innerText || '').trim();
            const totalMatch = text.match(/Total\s*(?:Lectures|Classes)?\s*[:\s]*(\d+)/i) || text.match(/Total\s*\n\s*(\d+)/i);
            const presentMatch = text.match(/Present\s*[:\s]*(\d+)/i) || text.match(/Present\s*\n\s*(\d+)/i);

            if (totalMatch && presentMatch) {
              const total = parseInt(totalMatch[1], 10);
              const attended = parseInt(presentMatch[1], 10);
              const codeMatch = text.match(/\b([0-9]{3}[A-Z]{2,3}[0-9]-[0-9]+|[A-Z]{2,6}[0-9]{2,4}|[A-Z0-9-]{5,15})\b/);
              const code = codeMatch ? codeMatch[1].trim() : ('SUB' + (data.length + 1));

              const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
              let name = 'Course';
              for (let line of lines) {
                if (/^(Total|Present|Absent|Activities|\d+([.]\d+)?%|\d+$)/i.test(line)) continue;
                if (line === code) continue;
                if (line.length >= 3) {
                  name = line;
                  break;
                }
              }

              const isLab = name.toLowerCase().includes('lab') || text.toLowerCase().includes('practical');

              if (total >= attended && total > 0) {
                const key = code + '::' + name;
                if (!seenCodes.has(key)) {
                  seenCodes.add(key);
                  data.push({
                    code,
                    name: name.replace(/^[A-Z0-9-]+\s*[-:]?\s*/, '').trim() || name,
                    attended,
                    total,
                    type: isLab ? 'Lab' : 'Lecture'
                  });
                }
              }
            }
          }
        } catch (e) {}

        // 2. Legacy Table rows
        if (data.length === 0) {
          try {
            const rows = doc.querySelectorAll('table tr, .grid-row, .table-row, [role="row"]');
            rows.forEach(r => {
              const cells = Array.from(r.querySelectorAll('td, th, .grid-cell, [role="cell"]')).map(c => c.innerText.trim());
              if (cells.length >= 3) {
                const nums = cells.map(c => parseInt(c, 10)).filter(n => !isNaN(n));
                if (nums.length >= 2) {
                  const name = cells[0] || cells[1] || 'Course';
                  const attended = nums[0];
                  const total = nums[1];
                  if (total >= attended && total > 0) {
                    const code = name.substring(0, 8).trim();
                    const key = code + '::' + name;
                    if (!seenCodes.has(key)) {
                      seenCodes.add(key);
                      data.push({
                        code,
                        name: name.replace(/^[A-Z0-9-]+\s*/, '').trim() || name,
                        attended,
                        total,
                        type: name.toLowerCase().includes('lab') ? 'Lab' : 'Lecture'
                      });
                    }
                  }
                }
              }
            });
          } catch (e) {}
        }

        // 3. Fallback regex
        if (data.length === 0 && doc.body) {
          try {
            const fullText = doc.body.innerText || '';
            const blockRegex = /([A-Za-z0-9\s()&,.-]{4,45})\s+([A-Z0-9-]{5,15})[\s\S]*?Total\s*Lectures\s*(\d+)[\s\S]*?Present\s*(\d+)/gi;
            let match;
            while ((match = blockRegex.exec(fullText)) !== null) {
              const name = match[1].trim();
              const code = match[2].trim();
              const total = parseInt(match[3], 10);
              const attended = parseInt(match[4], 10);
              if (total >= attended && total > 0) {
                const key = code + '::' + name;
                if (!seenCodes.has(key)) {
                  seenCodes.add(key);
                  data.push({
                    code,
                    name: name.replace(/^[A-Z0-9-]+\s*/, '').trim() || name,
                    attended,
                    total,
                    type: (name.toLowerCase().includes('lab') || match[0].includes('Practical')) ? 'Lab' : 'Lecture'
                  });
                }
              }
            }
          } catch (e) {}
        }

        return data;
      }

      let res = extractFromDoc(document);
      if (res.length > 0) return res;

      const iframes = document.querySelectorAll('iframe, frame');
      for (let i = 0; i < iframes.length; i++) {
        try {
          const fDoc = iframes[i].contentDocument || iframes[i].contentWindow?.document;
          if (fDoc) {
            const fRes = extractFromDoc(fDoc);
            if (fRes.length > 0) return fRes;
          }
        } catch (e) {}
      }

      return [];
    }
  }, (results) => {
    if (results && results[0] && results[0].result && results[0].result.length > 0) {
      const data = results[0].result;
      const json = JSON.stringify(data);
      navigator.clipboard.writeText(json).then(() => {
        const statusEl = document.getElementById('status');
        if (statusEl) {
          statusEl.style.display = 'block';
          statusEl.textContent = `✓ Extracted ${data.length} courses! Redirecting...`;
        }
        const target = urlInput?.value.trim() || 'http://localhost:4321';
        const finalUrl = `${target}#tcs_sync=${encodeURIComponent(json)}`;
        setTimeout(() => {
          chrome.tabs.create({ url: finalUrl });
        }, 500);
      });
    } else {
      alert('Could not detect attendance data. Please make sure the TCS iON Attendance page is fully loaded.');
    }
  });
});
