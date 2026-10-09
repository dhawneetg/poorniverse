// content.js — TCS iON Card & Table Attendance Extractor (v1.1.0)
(function() {
  function extractFromDoc(doc) {
    if (!doc) return [];
    const data = [];
    const seenCodes = new Set();

    // -------------------------------------------------------------
    // STRATEGY 1: Card-Based Layout (Modern TCS iON Self Service)
    // As seen on g21.tcsion.com "My Attendance" Semester View
    // -------------------------------------------------------------
    try {
      const allElements = doc.querySelectorAll('*');
      const candidateCards = [];

      for (let i = 0; i < allElements.length; i++) {
        const el = allElements[i];
        const text = el.innerText || '';

        // Check if element contains both "Total Lectures" (or "Total") and "Present"
        if (text.includes('Total Lectures') && text.includes('Present')) {
          // Check if any child element ALSO contains both
          let isDeepest = true;
          for (let j = 0; j < el.children.length; j++) {
            const childText = el.children[j].innerText || '';
            if (childText.includes('Total Lectures') && childText.includes('Present')) {
              isDeepest = false;
              break;
            }
          }

          // Typical card length is 100-1000 characters
          if (isDeepest && text.length < 1500 && text.length > 30) {
            candidateCards.push(el);
          }
        }
      }

      for (let card of candidateCards) {
        const text = (card.innerText || '').trim();

        // 1. Extract Total Lectures count
        const totalMatch = text.match(/Total\s*(?:Lectures|Classes)?\s*[:\s]*(\d+)/i) || 
                           text.match(/Total\s*\n\s*(\d+)/i);

        // 2. Extract Present count
        const presentMatch = text.match(/Present\s*[:\s]*(\d+)/i) || 
                             text.match(/Present\s*\n\s*(\d+)/i);

        if (totalMatch && presentMatch) {
          const total = parseInt(totalMatch[1], 10);
          const attended = parseInt(presentMatch[1], 10);

          // 3. Extract course code badge (e.g. 261AS2-03, TUTOR001, CRT002, 261CE3-09)
          const codeMatch = text.match(/\b([0-9]{3}[A-Z]{2,3}[0-9]-[0-9]+|[A-Z]{2,6}[0-9]{2,4}|[A-Z0-9-]{5,15})\b/);
          const code = codeMatch ? codeMatch[1].trim() : ('SUB' + (data.length + 1));

          // 4. Extract subject name from top lines of the card
          const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
          let name = 'Course';

          for (let line of lines) {
            // Ignore system words, numbers, and badge code
            if (/^(Total|Present|Absent|Activities|\d+([.]\d+)?%|\d+$)/i.test(line)) continue;
            if (line === code) continue;
            if (line.length >= 3) {
              name = line;
              break;
            }
          }

          // Determine type: Lab vs Lecture
          const isLab = name.toLowerCase().includes('lab') || 
                        text.toLowerCase().includes('practical');

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
    } catch (e) {
      console.warn('[Poornima Companion] Card layout parsing warning:', e);
    }

    // -------------------------------------------------------------
    // STRATEGY 2: Legacy Table / Grid Rows (Legacy TCS iON Portals)
    // -------------------------------------------------------------
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
      } catch (e) {
        console.warn('[Poornima Companion] Table parsing warning:', e);
      }
    }

    // -------------------------------------------------------------
    // STRATEGY 3: Full Page Text Regex Scanning Fallback
    // -------------------------------------------------------------
    if (data.length === 0 && doc.body) {
      try {
        const fullText = doc.body.innerText || '';
        // Pattern: Subject Name followed by Code followed by Total Lectures X and Present Y
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
                name: name.replace(/^[A-Z0-9-]+\s*[-:]?\s*/, '').trim() || name,
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

  function extractAttendance() {
    // 1. Search main document
    let results = extractFromDoc(document);
    if (results.length > 0) return results;

    // 2. Search all accessible iframes
    try {
      const iframes = document.querySelectorAll('iframe, frame');
      for (let i = 0; i < iframes.length; i++) {
        try {
          const frameDoc = iframes[i].contentDocument || iframes[i].contentWindow?.document;
          if (frameDoc) {
            const frameResults = extractFromDoc(frameDoc);
            if (frameResults.length > 0) {
              return frameResults;
            }
          }
        } catch (err) {
          // Cross-origin iframe security catch
        }
      }
    } catch (e) {}

    return [];
  }

  // Only inject the floating badge in the topmost window to avoid duplicate buttons
  if (window.self === window.top && !document.getElementById('poornima-sync-banner')) {
    const banner = document.createElement('div');
    banner.id = 'poornima-sync-banner';
    banner.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999999;background:#141414;color:#ffffff;padding:12px 20px;border-radius:9999px;font-family:system-ui,-apple-system,sans-serif;font-size:13px;font-weight:600;box-shadow:0 10px 30px rgba(0,0,0,0.35);cursor:pointer;display:flex;align-items:center;gap:10px;border:1px solid #333333;transition:all 0.2s ease;user-select:none;';
    banner.innerHTML = '<span style="background:#0066ff;color:#fff;width:22px;height:22px;border-radius:30%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:bold;">P</span> <span>Sync with Poornima Companion</span>';

    banner.addEventListener('mouseenter', () => {
      banner.style.transform = 'translateY(-2px)';
      banner.style.borderColor = '#0066ff';
    });
    banner.addEventListener('mouseleave', () => {
      banner.style.transform = 'translateY(0)';
      banner.style.borderColor = '#333333';
    });

    banner.addEventListener('click', () => {
      const results = extractAttendance();
      if (results.length === 0) {
        alert('Could not find attendance cards or tables. Please make sure you are on the "Semester View" of the TCS iON Attendance page and that subjects have finished loading.');
        return;
      }

      const json = JSON.stringify(results);

      // Copy to clipboard
      navigator.clipboard.writeText(json).then(() => {
        banner.style.background = '#047857';
        banner.style.borderColor = '#059669';
        banner.innerHTML = '<span>✓ Copied ' + results.length + ' courses! Opening app...</span>';

        // Check if user configured custom URL or default localhost
        const handleOpen = (targetUrl) => {
          const baseUrl = targetUrl || 'http://localhost:4321';
          const encoded = encodeURIComponent(json);
          // Pass sync data in URL hash for zero-click automatic import
          const finalUrl = baseUrl.includes('#') ? baseUrl : `${baseUrl}#tcs_sync=${encoded}`;
          window.open(finalUrl, '_blank');
        };

        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
          chrome.storage.sync.get(['app_url'], (res) => {
            handleOpen(res.app_url);
          });
        } else {
          handleOpen('http://localhost:4321');
        }
      }).catch(err => {
        alert('Extracted ' + results.length + ' courses! Clipboard copy error: ' + err.message);
      });
    });

    document.body.appendChild(banner);
  }
})();
