// Background Service Worker for Instagram Reel Downloader & Twitter Scheduler
// Server-free approach: videos stored in IndexedDB, no local server needed for posting

// Configuration
const CONFIG = {
    downloadFolder: 'instagram_reels',
    fastDLUrl: 'https://fastdl.app/',
    serverUrl: 'http://localhost:3847', // Still used for Instagram download features
    postDelayMs: 10000 // 10 seconds between posts
};

let isDownloading = false;
let downloadCount = 0;

// =========================================================================
// INDEXEDDB HELPERS (for storing video files without a server)
// =========================================================================

function openVideoDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open('VideoSchedulerDB', 1);
        req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('videos')) {
                db.createObjectStore('videos', { keyPath: 'filename' });
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function saveVideoToDB(filename, blob) {
    const db = await openVideoDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('videos', 'readwrite');
        tx.objectStore('videos').put({ filename, blob, addedAt: Date.now() });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

async function getVideoFromDB(filename) {
    const db = await openVideoDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('videos', 'readonly');
        const req = tx.objectStore('videos').get(filename);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
    });
}

async function getAllVideosFromDB() {
    const db = await openVideoDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('videos', 'readonly');
        const req = tx.objectStore('videos').getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
    });
}

async function deleteVideoFromDB(filename) {
    const db = await openVideoDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('videos', 'readwrite');
        tx.objectStore('videos').delete(filename);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

async function clearAllVideosFromDB() {
    const db = await openVideoDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('videos', 'readwrite');
        tx.objectStore('videos').clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

// =========================================================================
// EXTENSION INIT
// =========================================================================

chrome.runtime.onInstalled.addListener(async () => {
    console.log('Instagram Reel Downloader installed');
    const data = await chrome.storage.local.get(['downloadCount']);
    downloadCount = data.downloadCount || 0;

    await chrome.storage.local.set({
        savedLinks: [],
        downloadedVideos: [],
        downloadCount: downloadCount,
        fastdlLinks: [],
        fastdlIndex: 0
    });
});

// =========================================================================
// MESSAGE HANDLER
// =========================================================================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

    if (request.action === 'getSavedLinks') {
        chrome.storage.local.get(['savedLinks'], (data) => {
            sendResponse({ links: data.savedLinks || [] });
        });
        return true;
    }

    if (request.action === 'downloadVideo') {
        chrome.downloads.download({
            url: request.url,
            filename: request.filename || 'video.mp4',
            saveAs: false
        }, (downloadId) => {
            if (chrome.runtime.lastError) {
                sendResponse({ success: false, error: chrome.runtime.lastError.message });
            } else {
                sendResponse({ success: true, downloadId });
            }
        });
        return true;
    }

    if (request.action === 'clearSavedLinks') {
        chrome.storage.local.set({ savedLinks: [] })
            .then(() => sendResponse({ success: true }));
        return true;
    }

    if (request.action === 'removeSavedLink') {
        removeSavedLink(request.index)
            .then(() => sendResponse({ success: true }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }

    if (request.action === 'startFastDLDownloads') {
        startFastDLDownloads()
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }

    if (request.action === 'fastDLComplete') {
        handleFastDLComplete(request.success, request.downloaded, request.total)
            .then(() => sendResponse({ success: true }));
        return true;
    }

    if (request.action === 'getDownloadedVideos') {
        chrome.storage.local.get(['downloadedVideos'], (data) => {
            sendResponse(data);
        });
        return true;
    }

    // --- Video Storage (IndexedDB) ---

    if (request.action === 'storeVideo') {
        // Called from popup when user picks files
        (async () => {
            try {
                // request.filename and request.dataUrl come from the popup
                const blob = await fetch(request.dataUrl).then(r => r.blob());
                await saveVideoToDB(request.filename, blob);
                sendResponse({ success: true });
            } catch (e) {
                sendResponse({ success: false, error: e.message });
            }
        })();
        return true;
    }

    if (request.action === 'getStoredVideos') {
        (async () => {
            try {
                const videos = await getAllVideosFromDB();
                sendResponse({
                    success: true,
                    videos: videos.map(v => ({
                        filename: v.filename,
                        size: v.blob.size,
                        addedAt: v.addedAt
                    }))
                });
            } catch (e) {
                sendResponse({ success: false, error: e.message, videos: [] });
            }
        })();
        return true;
    }

    if (request.action === 'clearStoredVideos') {
        clearAllVideosFromDB()
            .then(() => sendResponse({ success: true }))
            .catch(e => sendResponse({ success: false, error: e.message }));
        return true;
    }

    // --- Scheduling ---

    if (request.action === 'startScheduling') {
        startScheduling(request.batchSize, request.hourGap || 1).then(() => sendResponse({ success: true }))
            .catch(e => sendResponse({ success: false, error: e.message }));
        return true;
    }

    if (request.action === 'stopScheduling') {
        stopScheduling().then(() => sendResponse({ success: true }));
        return true;
    }

    if (request.action === 'twitterPostComplete') {
        handlePostComplete(request.success, request.filename, request.error)
            .then(() => sendResponse({ success: true }));
        return true;
    }

    if (request.action === 'getScheduleStatus') {
        chrome.storage.local.get(['scheduledQueue', 'isScheduling', 'currentlyPosting', 'scheduleLog'], (data) => {
            sendResponse({
                isScheduling: data.isScheduling || false,
                queue: data.scheduledQueue || [],
                currentlyPosting: data.currentlyPosting || null,
                log: data.scheduleLog || []
            });
        });
        return true;
    }

    // Fetch video from IndexedDB (replaces server fetch)
    if (request.action === 'fetchVideo') {
        (async () => {
            try {
                const record = await getVideoFromDB(request.filename);
                if (!record) throw new Error('Video not found in storage: ' + request.filename);

                const blob = record.blob;
                const reader = new FileReader();
                reader.onloadend = () => {
                    sendResponse({ success: true, data: reader.result, size: blob.size });
                };
                reader.onerror = () => {
                    sendResponse({ success: false, error: 'Failed to read video blob' });
                };
                reader.readAsDataURL(blob);
            } catch (e) {
                sendResponse({ success: false, error: e.message });
            }
        })();
        return true;
    }

    if (request.action === 'getDownloadStatus') {
        sendResponse({ isDownloading });
        return true;
    }
});

// =========================================================================
// SCHEDULING LOGIC (reads from IndexedDB instead of server)
// =========================================================================

async function startScheduling(batchSize, hourGap) {
    try {
        console.log('[Scheduler] Starting with batch size:', batchSize, 'hour gap:', hourGap);

        const videos = await getAllVideosFromDB();

        if (videos.length === 0) {
            throw new Error('No videos loaded. Select video files first using the file picker.');
        }

        const toSchedule = videos.slice(0, batchSize);
        const queue = toSchedule.map(v => ({
            id: v.filename,
            filename: v.filename,
            status: 'queued'
        }));

        await chrome.storage.local.set({
            scheduledQueue: queue,
            isScheduling: true,
            currentlyPosting: null,
            scheduleHourGap: hourGap,
            scheduleBaseTime: Date.now(), // Base = exact moment scheduling starts
            scheduleLog: [`[${new Date().toLocaleTimeString()}] Started scheduling ${queue.length} videos (${hourGap}h gap)`]
        });

        console.log('[Scheduler] Queue created with', queue.length, 'videos');
        await postNextVideo();
    } catch (e) {
        console.error('[Scheduler] Start error:', e);
        throw e;
    }
}

async function stopScheduling() {
    console.log('[Scheduler] Stopping');
    await addLog('Scheduling stopped by user');
    await chrome.storage.local.set({
        isScheduling: false,
        currentlyPosting: null
    });
}

async function postNextVideo() {
    const data = await chrome.storage.local.get(['scheduledQueue', 'isScheduling', 'scheduleHourGap', 'scheduleBaseTime']);
    if (!data.isScheduling) return;
    const hourGap = data.scheduleHourGap || 1;
    const baseTime = data.scheduleBaseTime || Date.now();

    const queue = data.scheduledQueue || [];
    const next = queue.find(v => v.status === 'queued');

    if (!next) {
        console.log('[Scheduler] No more videos in queue');
        await addLog('🎉 All videos processed!');
        await chrome.storage.local.set({ isScheduling: false, currentlyPosting: null });
        return;
    }

    const postedCount = queue.filter(v => v.status === 'posted' || v.status === 'posting').length;

    next.status = 'posting';
    await chrome.storage.local.set({ currentlyPosting: next, scheduledQueue: queue });
    await addLog(`Posting: ${next.filename} (index ${postedCount})`);

    // Find existing X.com tab
    const tabs = await chrome.tabs.query({ url: '*://x.com/*' });

    if (tabs.length > 0) {
        const xTab = tabs[0];
        console.log('[Scheduler] Found X tab:', xTab.id);
        await chrome.tabs.update(xTab.id, { active: true });

        // Try to inject the content script
        try {
            await chrome.scripting.executeScript({
                target: { tabId: xTab.id },
                files: ['content/twitter.js']
            });
        } catch (e) {
            console.log('[Scheduler] Script inject:', e.message);
        }

        setTimeout(() => {
            chrome.tabs.sendMessage(xTab.id, {
                action: 'START_JOB',
                video: next,
                videoIndex: postedCount,
                hourGap: hourGap,
                baseTime: baseTime
            }).catch(err => {
                console.error('[Scheduler] Error sending to tab:', err);
                addLog(`Error: ${err.message}`);
                next.status = 'queued';
                chrome.storage.local.set({ scheduledQueue: queue, currentlyPosting: null });
            });
        }, 2000);
    } else {
        console.log('[Scheduler] No X.com tab found!');
        await addLog('ERROR: No X.com tab found! Please open x.com and try again.');
        next.status = 'queued';
        await chrome.storage.local.set({
            scheduledQueue: queue,
            currentlyPosting: null,
            isScheduling: false
        });
    }
}

async function handlePostComplete(success, filename, error) {
    const data = await chrome.storage.local.get(['scheduledQueue', 'currentlyPosting']);
    let queue = data.scheduledQueue || [];
    const current = data.currentlyPosting;

    if (current) {
        const idx = queue.findIndex(v => v.filename === current.filename);
        if (idx !== -1) {
            queue[idx].status = success ? 'posted' : 'failed';
            if (error) queue[idx].error = error;
        }

        await chrome.storage.local.set({ scheduledQueue: queue, currentlyPosting: null });

        if (success) {
            await addLog(`✅ Posted: ${current.filename}`);

            // Delete video from IndexedDB after successful post
            try {
                await deleteVideoFromDB(current.filename);
                await addLog(`🗑️ Removed: ${current.filename} from storage`);
            } catch (e) {
                await addLog(`⚠️ Failed to remove ${current.filename}: ${e.message}`);
            }

            // Process next video after delay
            const remaining = queue.filter(v => v.status === 'queued').length;
            if (remaining > 0) {
                await addLog(`⏳ Waiting ${CONFIG.postDelayMs / 1000}s... (${remaining} remaining)`);
                setTimeout(() => postNextVideo(), CONFIG.postDelayMs);
            } else {
                await addLog('🎉 All videos processed!');
                await chrome.storage.local.set({ isScheduling: false });
            }
        } else {
            // STOP the entire queue on failure — do NOT continue to next video
            await addLog(`❌ Failed: ${current.filename} — ${error || 'Unknown error'}`);
            await addLog('🛑 Scheduling STOPPED due to error. Fix the issue and restart.');
            await chrome.storage.local.set({ isScheduling: false });
        }
    }
}

async function addLog(message) {
    const data = await chrome.storage.local.get(['scheduleLog']);
    const log = data.scheduleLog || [];
    log.push(`[${new Date().toLocaleTimeString()}] ${message}`);
    if (log.length > 50) log.splice(0, log.length - 50);
    await chrome.storage.local.set({ scheduleLog: log });
}

// =========================================================================
// INSTAGRAM DOWNLOAD LOGIC (still uses server for extraction)
// =========================================================================

async function removeSavedLink(index) {
    const data = await chrome.storage.local.get(['savedLinks']);
    const savedLinks = data.savedLinks || [];
    if (index >= 0 && index < savedLinks.length) {
        savedLinks.splice(index, 1);
        await chrome.storage.local.set({ savedLinks });
    }
}

async function startFastDLDownloads() {
    if (isDownloading) {
        return { success: false, error: 'Already downloading' };
    }

    const data = await chrome.storage.local.get(['savedLinks']);
    const savedLinks = data.savedLinks || [];

    if (savedLinks.length === 0) {
        return { success: false, error: 'No links to download' };
    }

    isDownloading = true;
    const urls = savedLinks.map(link => typeof link === 'string' ? link : link.url);

    await chrome.storage.local.set({
        fastdlLinks: urls,
        fastdlIndex: 0
    });

    await chrome.tabs.create({
        url: CONFIG.fastDLUrl,
        active: true
    });

    return { success: true, message: 'Opening FastDL...' };
}

async function handleFastDLComplete(success, downloaded, total) {
    console.log(`FastDL complete: ${downloaded}/${total}`);
    isDownloading = false;

    if (success && downloaded > 0) {
        const data = await chrome.storage.local.get(['downloadedVideos', 'downloadCount', 'savedLinks']);
        let downloadedVideos = data.downloadedVideos || [];
        let count = data.downloadCount || 0;
        const savedLinks = data.savedLinks || [];

        for (let i = 0; i < downloaded; i++) {
            count++;
            downloadedVideos.push({
                id: count,
                filename: `${count}.mp4`,
                sourceUrl: savedLinks[i]?.url || savedLinks[i] || 'unknown',
                downloadedAt: new Date().toISOString(),
                status: 'pending'
            });
        }

        await chrome.storage.local.set({
            savedLinks: [],
            downloadedVideos,
            downloadCount: count,
            fastdlLinks: [],
            fastdlIndex: 0
        });
    }
}

console.log('[ServiceWorker] Loaded — server-free scheduling mode');
