// content.js — Extracts TCS iON attendance tables and injects a 1-click sync banner
(function() {
  function extractAttendance() {
    const rows = document.querySelectorAll('table tr, .grid-row, .table-row, [role="row"]');
    const data = [];

    rows.forEach(r => {
      const cells = Array.from(r.querySelectorAll('td, th, .grid-cell, [role="cell"]')).map(c => c.innerText.trim());
      if (cells.length >= 3) {
        const nums = cells.map(c => parseInt(c, 10)).filter(n => !isNaN(n));
        if (nums.length >= 2) {
          const name = cells[0] || cells[1] || 'Course';
          const attended = nums[0];
          const total = nums[1];
          if (total >= attended && total > 0) {
            data.push({
              code: name.substring(0, 8).trim(),
              name: name.replace(/^[A-Z0-9-]+\s*/, '').trim() || name,
              attended,
              total,
              type: name.toLowerCase().includes('lab') ? 'Lab' : 'Lecture'
            });
          }
        }
      }
    });

    return data;
  }

  // Inject floating 1-click sync badge on TCS iON pages
  if (!document.getElementById('poornima-sync-banner')) {
    const banner = document.createElement('div');
    banner.id = 'poornima-sync-banner';
    banner.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:999999;background:#141414;color:#ffffff;padding:12px 20px;border-radius:9999px;font-family:system-ui,sans-serif;font-size:13px;font-weight:600;box-shadow:0 8px 30px rgba(0,0,0,0.25);cursor:pointer;display:flex;align-items:center;gap:10px;border:1px solid #333333;';
    banner.innerHTML = '<span style="background:#0066ff;color:#fff;width:22px;height:22px;border-radius:30%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:bold;">P</span> <span>Sync with Poornima Companion</span>';
    
    banner.addEventListener('click', () => {
      const results = extractAttendance();
      if (results.length === 0) {
        alert('Please navigate to your TCS iON Attendance page first.');
        return;
      }
      const json = JSON.stringify(results);
      navigator.clipboard.writeText(json).then(() => {
        banner.style.background = '#047857';
        banner.innerHTML = '<span>✓ Copied ' + results.length + ' courses to clipboard!</span>';

        // Check if user configured custom Vercel URL
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
          chrome.storage.sync.get(['app_url'], (res) => {
            const targetUrl = res.app_url || 'http://localhost:4321';
            window.open(targetUrl, '_blank');
          });
        } else {
          window.open('http://localhost:4321', '_blank');
        }
      });
    });

    document.body.appendChild(banner);
  }
})();
