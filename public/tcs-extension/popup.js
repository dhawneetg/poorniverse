const urlInput = document.getElementById('target-url');

// Load stored target URL or default
if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
  chrome.storage.sync.get(['app_url'], (res) => {
    urlInput.value = res.app_url || 'http://localhost:4321';
  });
}

urlInput.addEventListener('change', () => {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
    chrome.storage.sync.set({ app_url: urlInput.value.trim() });
  }
});

document.getElementById('btn-sync').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.url || !tab.url.includes('tcsion.com')) {
    alert('Please switch to your TCS iON Attendance page tab first.');
    return;
  }

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
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
  }, (results) => {
    if (results && results[0] && results[0].result) {
      const data = results[0].result;
      navigator.clipboard.writeText(JSON.stringify(data)).then(() => {
        document.getElementById('status').style.display = 'block';
        const target = urlInput.value.trim() || 'http://localhost:4321';
        setTimeout(() => {
          chrome.tabs.create({ url: target });
        }, 600);
      });
    }
  });
});
