// Popup Script - Management

document.addEventListener('DOMContentLoaded', async () => {
  // Elements
  const tabs = document.querySelectorAll('.tab');
  const linksPanel = document.getElementById('links-panel');
  const downloadedPanel = document.getElementById('downloaded-panel');
  const schedulePanel = document.getElementById('schedule-panel');

  const linksList = document.getElementById('links-list');
  const downloadedList = document.getElementById('downloaded-list');
  const scheduleList = document.getElementById('schedule-list');

  const linksCount = document.getElementById('links-count');
  const downloadedCount = document.getElementById('downloaded-count');
  const scheduleCount = document.getElementById('schedule-count');

  const downloadAllBtn = document.getElementById('download-all-btn');
  const clearLinksBtn = document.getElementById('clear-links-btn');
  const toggleSchedulingBtn = document.getElementById('toggle-scheduling');
  const batchSizeInput = document.getElementById('batch-size');
  const statusDisplay = document.getElementById('status-display');
  const scheduleLogEl = document.getElementById('schedule-log');

  // File picker elements
  const selectVideosBtn = document.getElementById('select-videos-btn');
  const videoFileInput = document.getElementById('video-file-input');
  const uploadProgress = document.getElementById('upload-progress');
  const storedInfo = document.getElementById('stored-info');
  const clearVideosBtn = document.getElementById('clear-videos-btn');

  // Icons
  const DELETE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>`;
  const CHECK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`;
  const LINK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>`;

  const STATUS_ICONS = {
    queued: '⏸',
    posting: '⏳',
    posted: '✅',
    failed: '❌'
  };

  const STATUS_COLORS = {
    queued: '#888',
    posting: '#1DA1F2',
    posted: '#4CAF50',
    failed: '#f44336'
  };

  // ---- Tab switching ----
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const tabName = tab.dataset.tab;
      linksPanel.classList.toggle('active', tabName === 'links');
      downloadedPanel.classList.toggle('active', tabName === 'downloaded');
      schedulePanel.classList.toggle('active', tabName === 'schedule');

      if (tabName === 'schedule') {
        loadScheduleStatus();
        loadStoredVideos();
      }
    });
  });

  // ---- File Picker ----

  selectVideosBtn.addEventListener('click', () => {
    videoFileInput.click();
  });

  videoFileInput.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const mp4Files = files.filter(f => f.name.toLowerCase().endsWith('.mp4') || f.type.startsWith('video/'));

    if (mp4Files.length === 0) {
      alert('No video files selected.');
      return;
    }

    selectVideosBtn.disabled = true;
    uploadProgress.style.display = 'block';
    uploadProgress.textContent = `Loading 0/${mp4Files.length}...`;

    let loaded = 0;
    for (const file of mp4Files) {
      try {
        uploadProgress.textContent = `Loading ${loaded + 1}/${mp4Files.length}: ${file.name}`;

        // Read file as data URL and send to service worker to store in IndexedDB
        const dataUrl = await readFileAsDataUrl(file);
        const res = await chrome.runtime.sendMessage({
          action: 'storeVideo',
          filename: file.name,
          dataUrl: dataUrl
        });

        if (!res.success) {
          console.error('Failed to store:', file.name, res.error);
        }

        loaded++;
      } catch (err) {
        console.error('Error loading file:', file.name, err);
      }
    }

    uploadProgress.textContent = `✅ Loaded ${loaded} videos!`;
    setTimeout(() => {
      uploadProgress.style.display = 'none';
    }, 2000);

    selectVideosBtn.disabled = false;
    videoFileInput.value = ''; // Reset input
    loadStoredVideos();
  });

  clearVideosBtn.addEventListener('click', async () => {
    if (confirm('Remove all loaded videos from storage?')) {
      await chrome.runtime.sendMessage({ action: 'clearStoredVideos' });
      loadStoredVideos();
    }
  });

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  async function loadStoredVideos() {
    try {
      const res = await chrome.runtime.sendMessage({ action: 'getStoredVideos' });
      if (res.success) {
        const count = res.videos.length;
        const totalMB = res.videos.reduce((sum, v) => sum + (v.size || 0), 0) / 1024 / 1024;
        storedInfo.textContent = count > 0
          ? `📦 ${count} video${count > 1 ? 's' : ''} loaded (${totalMB.toFixed(1)} MB)`
          : 'No videos loaded';
        storedInfo.style.color = count > 0 ? '#4CAF50' : '#888';
      }
    } catch (e) {
      console.error('Failed to load stored videos:', e);
    }
  }

  // ---- Data Loading ----

  async function loadData() {
    try {
      const linksResponse = await chrome.runtime.sendMessage({ action: 'getSavedLinks' });
      const links = linksResponse.links || [];
      linksCount.textContent = links.length;
      renderLinks(links);

      const videosResponse = await chrome.runtime.sendMessage({ action: 'getDownloadedVideos' });
      const downloadedVideos = videosResponse.downloadedVideos || [];
      downloadedCount.textContent = downloadedVideos.length;
      renderDownloaded(downloadedVideos);

      const statusResponse = await chrome.runtime.sendMessage({ action: 'getDownloadStatus' });
      updateDownloadStatus(statusResponse.isDownloading);

      await loadScheduleStatus();
      await loadStoredVideos();

    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }

  // ---- Schedule Status ----

  async function loadScheduleStatus() {
    try {
      const res = await chrome.runtime.sendMessage({ action: 'getScheduleStatus' });
      const { isScheduling, queue, currentlyPosting, log } = res;

      scheduleCount.textContent = queue.length > 0 ? queue.length : '0';

      if (isScheduling) {
        toggleSchedulingBtn.textContent = '⏹ Stop Schedule';
        toggleSchedulingBtn.style.backgroundColor = '#f44336';
        toggleSchedulingBtn.classList.add('active');
        statusDisplay.style.color = '#1DA1F2';

        const queuedCount = queue.filter(v => v.status === 'queued' || v.status === 'posting').length;
        if (currentlyPosting) {
          statusDisplay.textContent = `🔄 Posting: ${currentlyPosting.filename}`;
        } else {
          statusDisplay.textContent = `⏳ Processing... (${queuedCount} remaining)`;
        }
      } else {
        toggleSchedulingBtn.textContent = '▶ Start Schedule';
        toggleSchedulingBtn.style.backgroundColor = '#1DA1F2';
        toggleSchedulingBtn.classList.remove('active');

        if (queue.length > 0) {
          const posted = queue.filter(v => v.status === 'posted').length;
          const failed = queue.filter(v => v.status === 'failed').length;
          statusDisplay.textContent = `Done: ${posted} posted, ${failed} failed`;
          statusDisplay.style.color = posted > 0 ? '#4CAF50' : '#aaa';
        } else {
          statusDisplay.textContent = 'Status: Idle';
          statusDisplay.style.color = '#aaa';
        }
      }

      renderScheduleQueue(queue);
      renderScheduleLog(log || []);

    } catch (e) {
      console.error('Failed to load schedule status:', e);
    }
  }

  function renderScheduleQueue(queue) {
    if (queue.length === 0) {
      scheduleList.innerHTML = '';
      return;
    }

    scheduleList.innerHTML = queue.map((v) => `
      <div class="list-item" style="padding: 8px 12px; border-bottom: 1px solid #2a2a2a;">
        <span style="margin-right: 8px; font-size: 14px;">${STATUS_ICONS[v.status] || '?'}</span>
        <div style="flex: 1; min-width: 0;">
          <div style="font-size: 12px; color: #ddd; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${v.filename}</div>
        </div>
        <span style="font-size: 11px; color: ${STATUS_COLORS[v.status] || '#888'}; text-transform: uppercase; font-weight: 600; margin-left: 8px;">${v.status}</span>
      </div>
    `).join('');
  }

  function renderScheduleLog(log) {
    if (log.length === 0) {
      scheduleLogEl.style.display = 'none';
      return;
    }
    scheduleLogEl.style.display = 'block';
    scheduleLogEl.innerHTML = log.map(line =>
      `<div style="margin-bottom: 2px; word-break: break-word;">${line}</div>`
    ).join('');
    scheduleLogEl.scrollTop = scheduleLogEl.scrollHeight;
  }

  // ---- Render Links ----

  function renderLinks(links) {
    if (links.length === 0) {
      linksList.innerHTML = `
        <div class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
          </svg>
          <p>No links saved</p>
          <span>Visit Instagram and click the save button on reels</span>
        </div>
      `;
      return;
    }

    linksList.innerHTML = links.map((link, index) => {
      const url = typeof link === 'string' ? link : link.url;
      const date = typeof link === 'string' ? 'Just now' : new Date(link.timestamp).toLocaleTimeString();
      return `
        <div class="list-item">
          <div class="item-icon">${LINK_ICON}</div>
          <div class="item-content">
            <div class="item-title">Instagram Reel ${index + 1}</div>
            <div class="item-subtitle">${date}</div>
            <div class="item-link" title="${url}">${url}</div>
          </div>
          <div class="item-actions">
            <button class="icon-btn delete-btn" data-index="${index}" title="Remove">
              ${DELETE_ICON}
            </button>
          </div>
        </div>
      `;
    }).join('');

    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const index = parseInt(e.currentTarget.dataset.index);
        await chrome.runtime.sendMessage({ action: 'removeSavedLink', index });
        loadData();
      });
    });
  }

  // ---- Render Downloaded ----

  function renderDownloaded(videos) {
    if (videos.length === 0) {
      downloadedList.innerHTML = `
        <div class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/>
          </svg>
          <p>No videos downloaded</p>
          <span>Download links from the first tab</span>
        </div>
      `;
      return;
    }

    downloadedList.innerHTML = videos.map((video) => `
      <div class="list-item">
        <div class="item-icon success">${CHECK_ICON}</div>
        <div class="item-content">
          <div class="item-title">${video.filename}</div>
          <div class="item-subtitle">Downloaded ${new Date(video.downloadedAt).toLocaleTimeString()}</div>
        </div>
      </div>
    `).join('');
  }

  function updateDownloadStatus(downloading) {
    if (downloading) {
      downloadAllBtn.textContent = 'Downloading...';
      downloadAllBtn.disabled = true;
      downloadAllBtn.classList.add('loading');
    } else {
      downloadAllBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
        </svg>
        Download All
      `;
      downloadAllBtn.disabled = false;
      downloadAllBtn.classList.remove('loading');
    }
  }

  // ---- Event Listeners ----

  downloadAllBtn.addEventListener('click', async () => {
    downloadAllBtn.disabled = true;
    downloadAllBtn.textContent = 'Starting...';
    try {
      const response = await chrome.runtime.sendMessage({ action: 'startFastDLDownloads' });
      if (!response.success) {
        alert(response.error);
        loadData();
      }
    } catch (e) {
      alert('Error: ' + e.message);
      loadData();
    }
  });

  toggleSchedulingBtn.addEventListener('click', async () => {
    const isRunning = toggleSchedulingBtn.classList.contains('active');
    const action = isRunning ? 'stopScheduling' : 'startScheduling';
    const batchSize = parseInt(batchSizeInput.value) || 10;
    const hourGap = parseFloat(document.getElementById('hour-gap').value) || 1;

    toggleSchedulingBtn.disabled = true;
    statusDisplay.textContent = isRunning ? 'Stopping...' : 'Starting...';

    try {
      const res = await chrome.runtime.sendMessage({ action, batchSize, hourGap });
      if (!res.success) {
        alert(res.error);
      } else if (!isRunning) {
        statusDisplay.textContent = '🚀 Scheduling started! Check X.com tab.';
        setTimeout(() => window.close(), 1500);
        return;
      }
    } catch (e) {
      alert(e.message);
    }

    toggleSchedulingBtn.disabled = false;
    await loadScheduleStatus();
  });

  clearLinksBtn.addEventListener('click', async () => {
    if (confirm('Clear all saved links?')) {
      await chrome.runtime.sendMessage({ action: 'clearSavedLinks' });
      loadData();
    }
  });

  // Initial load
  loadData();

  // Refresh every 2 seconds
  setInterval(loadData, 2000);
});
