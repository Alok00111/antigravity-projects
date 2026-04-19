// FastDL Content Script - Two Button Workflow (Fixed)

(function () {
    'use strict';

    console.log('FastDL automation starting...');

    // Create overlay UI
    function createOverlay(current, total) {
        let overlay = document.getElementById('fastdl-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'fastdl-overlay';
            overlay.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 20px 30px;
        border-radius: 12px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 16px;
        z-index: 999999;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        min-width: 200px;
        text-align: center;
      `;
            document.body.appendChild(overlay);
        }
        overlay.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 8px;">🎬 Auto Downloading...</div>
      <div id="fastdl-status">Starting...</div>
      <div style="margin-top: 8px; font-size: 24px; font-weight: bold;">${current} / ${total}</div>
    `;
        return overlay;
    }

    function updateStatus(text) {
        const el = document.getElementById('fastdl-status');
        if (el) el.textContent = text;
        console.log('Status:', text);
    }

    function wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Find the input field
    function findInput() {
        const inputs = document.querySelectorAll('input');
        for (const input of inputs) {
            if (input.type === 'hidden') continue;
            const rect = input.getBoundingClientRect();
            if (rect.width > 100 && rect.height > 20) {
                return input;
            }
        }
        return null;
    }

    // Find the FIRST Download button (blue button next to input - for searching)
    function findFirstDownloadButton(inputRect) {
        // Look for buttons with "Download" text that are below the header (y > 100)
        // and near the input field
        const buttons = document.querySelectorAll('button');

        for (const btn of buttons) {
            const text = btn.textContent.trim();
            const rect = btn.getBoundingClientRect();

            // Must be visible and below the header navigation
            if (rect.width < 50 || rect.height < 30) continue;
            if (rect.top < 150) continue; // Skip header buttons

            // Check if text is exactly "Download"
            if (text === 'Download') {
                // Check if it's near the input field (within same row, roughly)
                if (inputRect && Math.abs(rect.top - inputRect.top) < 50) {
                    console.log('Found FIRST download button near input:', rect);
                    return btn;
                }
            }
        }

        // Fallback: Any button with "Download" text below y=150
        for (const btn of buttons) {
            const text = btn.textContent.trim();
            const rect = btn.getBoundingClientRect();

            if (rect.top < 150) continue;
            if (text === 'Download' && rect.width > 80) {
                console.log('Found FIRST download button (fallback):', rect);
                return btn;
            }
        }

        return null;
    }

    // Find the SECOND Download button (appears after video loads - has video URL)
    function findSecondDownloadButton() {
        // This button has class button__download and contains media.fastdl.app URL
        const exactBtn = document.querySelector('a.button__download');
        if (exactBtn && exactBtn.href && exactBtn.href.includes('media.fastdl.app')) {
            console.log('Found SECOND download button with video URL');
            return exactBtn;
        }

        // Backup: any link with download attribute
        const downloadLink = document.querySelector('a[download="true"]');
        if (downloadLink && downloadLink.href) {
            console.log('Found download=true link');
            return downloadLink;
        }

        // Backup: link to media.fastdl.app
        const mediaLink = document.querySelector('a[href*="media.fastdl.app"]');
        if (mediaLink) {
            console.log('Found media.fastdl.app link');
            return mediaLink;
        }

        return null;
    }

    // Main automation
    async function runAutomation() {
        const data = await chrome.storage.local.get(['fastdlLinks', 'fastdlIndex']);
        const allLinks = data.fastdlLinks || [];
        let currentIndex = data.fastdlIndex || 0;

        console.log('Links:', allLinks.length, 'Index:', currentIndex);

        if (allLinks.length === 0) return;

        if (currentIndex >= allLinks.length) {
            document.getElementById('fastdl-overlay')?.remove();
            await chrome.storage.local.set({ fastdlLinks: [], fastdlIndex: 0 });
            chrome.runtime.sendMessage({ action: 'fastDLComplete', success: true, downloaded: allLinks.length });
            return;
        }

        const currentUrl = allLinks[currentIndex];
        createOverlay(currentIndex + 1, allLinks.length);

        // Dynamic wait based on index (longer wait every 5 items to avoid rate limits)
        const initWait = (currentIndex > 0 && currentIndex % 5 === 0) ? 5000 : 2500;
        await wait(initWait);

        // ========================================
        // STEP 1: Find and fill the input field
        // ========================================
        updateStatus('Entering URL...');
        const input = findInput();
        if (!input) {
            console.error('No input found');
            updateStatus('Error: No input');
            return;
        }

        const inputRect = input.getBoundingClientRect();

        input.focus();
        input.value = '';
        await wait(100);
        input.value = currentUrl;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        console.log('Entered URL:', currentUrl);
        await wait(500);

        // ========================================
        // STEP 2: Click FIRST Download button (search/submit)
        // ========================================
        updateStatus('Clicking search...');
        const firstBtn = findFirstDownloadButton(inputRect);
        if (firstBtn) {
            firstBtn.click();
            console.log('Clicked FIRST Download button');
        } else {
            console.log('No first button found, trying form submit');
            const form = input.closest('form');
            if (form) {
                form.submit();
            } else {
                input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }));
            }
        }

        // ========================================
        // STEP 3: Wait for video and SECOND button
        // ========================================
        updateStatus('Waiting for video...');

        let secondBtn = null;
        for (let i = 0; i < 40; i++) {
            await wait(1000);
            secondBtn = findSecondDownloadButton();
            if (secondBtn) {
                console.log('Found SECOND download button after', i + 1, 'seconds');
                break;
            }
        }

        if (!secondBtn) {
            updateStatus('Error: Video not found, skipping...');
            console.error('Second download button not found');

            // Log failure but continue to next
            const failedLog = data.failedLinks || [];
            failedLog.push({ url: currentUrl, reason: 'Video button not found' });
            await chrome.storage.local.set({ failedLinks: failedLog });

            currentIndex++;
            await chrome.storage.local.set({ fastdlIndex: currentIndex });
            await wait(2000);
            window.location.reload();
            return;
        }

        // ========================================
        // STEP 4: Click SECOND Download button (actual download)
        // ========================================
        updateStatus('Downloading video...');
        await wait(1000);

        console.log('Clicking SECOND Download button');
        secondBtn.click();

        // ========================================
        // STEP 5: Wait for download to complete
        // ========================================
        updateStatus('Waiting for download...');
        await wait(10000); // Wait 10 seconds

        // Move to next
        currentIndex++;
        await chrome.storage.local.set({ fastdlIndex: currentIndex });

        if (currentIndex < allLinks.length) {
            updateStatus('Loading next...');
            // Add a small random delay to seem more human
            await wait(3000 + Math.random() * 2000);
            window.location.reload();
        } else {
            updateStatus('✅ All done!');
            await wait(3000);
            document.getElementById('fastdl-overlay')?.remove();
            await chrome.storage.local.set({ fastdlLinks: [], fastdlIndex: 0 });
            chrome.runtime.sendMessage({ action: 'fastDLComplete', success: true, downloaded: allLinks.length });
        }
    }

    // Start
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(runAutomation, 2000));
    } else {
        setTimeout(runAutomation, 2000);
    }
})();
