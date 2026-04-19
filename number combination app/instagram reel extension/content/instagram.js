// Instagram Content Script - Save Links Mode

(function () {
  'use strict';

  const SAVE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/></svg>`;
  const CHECK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`;

  const processedVideos = new Set();

  // Add styles
  function addStyles() {
    if (document.getElementById('ig-save-styles')) return;

    const style = document.createElement('style');
    style.id = 'ig-save-styles';
    style.textContent = `
      .ig-reel-save-btn {
        position: absolute;
        bottom: 60px;
        left: 16px;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999999;
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.5);
        transition: all 0.3s ease;
      }
      .ig-reel-save-btn svg {
        width: 24px;
        height: 24px;
        fill: white;
      }
      .ig-reel-save-btn:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
      }
      .ig-reel-save-btn.saved {
        background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      }
      .reel-toast {
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: #667eea;
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        font-weight: 500;
        z-index: 9999999;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        transition: opacity 0.3s;
        opacity: 0;
      }
      .reel-toast.show { opacity: 1; }
      .reel-toast.success { background: #22c55e; }
      .reel-toast.error { background: #ef4444; }
    `;
    document.head.appendChild(style);
  }

  // Show toast
  function showToast(message, type = 'info') {
    const existingToast = document.querySelector('.reel-toast');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.className = `reel-toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('show'));

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    }, 3000);
  }

  // Get the current reel URL
  function getReelUrl() {
    const url = window.location.href;

    // Direct reel URL
    if (url.includes('/reel/')) {
      return url.split('?')[0];
    }

    // Reels feed
    if (url.includes('/reels/')) {
      // Try to find the specific reel being viewed
      const reelLinks = document.querySelectorAll('a[href*="/reel/"]');
      if (reelLinks.length > 0) {
        return reelLinks[0].href.split('?')[0];
      }
      return url.split('?')[0];
    }

    // DM opened reel - look for reel link in the page
    const reelLink = document.querySelector('a[href*="/reel/"]');
    if (reelLink) {
      return reelLink.href.split('?')[0];
    }

    return null;
  }

  // Create save button
  function createSaveButton() {
    const button = document.createElement('button');
    button.className = 'ig-reel-save-btn';
    button.innerHTML = SAVE_ICON;
    button.title = 'Save reel link';

    button.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (button.classList.contains('saving')) return;
      button.classList.add('saving');

      try {
        const reelUrl = getReelUrl();

        if (!reelUrl) {
          showToast('Could not find reel URL', 'error');
          button.classList.remove('saving');
          return;
        }

        const data = await chrome.storage.local.get(['savedLinks']);
        const savedLinks = data.savedLinks || [];

        const alreadySaved = savedLinks.some(link => {
          const linkUrl = typeof link === 'string' ? link : link.url;
          return linkUrl === reelUrl;
        });

        if (alreadySaved) {
          showToast('Already saved!', 'info');
          button.classList.remove('saving');
          return;
        }

        savedLinks.push({
          url: reelUrl,
          savedAt: new Date().toISOString()
        });

        await chrome.storage.local.set({ savedLinks });

        button.classList.add('saved');
        button.innerHTML = CHECK_ICON;
        showToast(`✓ Saved! (${savedLinks.length} total)`, 'success');

        setTimeout(() => {
          button.classList.remove('saved', 'saving');
          button.innerHTML = SAVE_ICON;
        }, 2000);

      } catch (error) {
        console.error('Save error:', error);
        showToast('Failed to save', 'error');
        button.classList.remove('saving');
      }
    });

    return button;
  }

  // Attach button to video container
  function attachButtonToVideo(video) {
    const videoId = video.src || video.currentSrc || Math.random().toString(36);

    if (processedVideos.has(videoId)) return;

    // Find the video's container (go up a few levels)
    let container = video.parentElement;
    for (let i = 0; i < 8 && container; i++) {
      // Check if this container is suitable (has dimensions and position)
      const rect = container.getBoundingClientRect();
      if (rect.width > 200 && rect.height > 300) {
        // Check if already has our button
        if (container.querySelector('.ig-reel-save-btn')) return;

        // Make container relative if not already positioned
        const position = window.getComputedStyle(container).position;
        if (position === 'static') {
          container.style.position = 'relative';
        }

        // Add button
        const button = createSaveButton();
        container.appendChild(button);
        processedVideos.add(videoId);
        console.log('Save button attached to video container');
        return;
      }
      container = container.parentElement;
    }
  }

  // Find and process all videos
  function findAndAttachButtons() {
    // Find all video elements
    const videos = document.querySelectorAll('video');

    videos.forEach(video => {
      // Only attach to visible videos that are playing or have src
      if (video.offsetParent !== null && (video.src || video.currentSrc)) {
        attachButtonToVideo(video);
      }
    });
  }

  // Initialize
  function init() {
    addStyles();
    findAndAttachButtons();
  }

  // Run on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Watch for new videos
  const observer = new MutationObserver(() => {
    findAndAttachButtons();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Also check periodically for dynamic content
  setInterval(findAndAttachButtons, 1500);

  // Check on video play
  document.addEventListener('play', (e) => {
    if (e.target.tagName === 'VIDEO') {
      setTimeout(() => attachButtonToVideo(e.target), 500);
    }
  }, true);

  console.log('Instagram save script loaded');
})();
