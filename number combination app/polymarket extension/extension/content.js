// content.js
console.log("[Polymarket Scraper] Auto-Bot Loaded");

class Scraper {
    constructor() {
        this.marketSet = new Set(); // IDs
        this.scrapedUrls = new Set(); // Full URLs for crawling
        this.observer = null;
        this.scrollInterval = null;
        this.uniqueLimit = 1000;
        this.isScraping = false;
    }

    async init() {
        // Check if we are in "Crawling Mode" (Phase 2)
        const { isCrawling, crawlQueue } = await chrome.storage.local.get(['isCrawling', 'crawlQueue']);

        if (isCrawling) {
            console.log(`[Scraper] Resuming Phase 2 (Deep Crawl). Queue: ${crawlQueue ? crawlQueue.length : 0} markets left.`);
            this.handleDeepCrawl(crawlQueue || []);
        } else {
            this.listenForMessages();
        }
    }

    listenForMessages() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            console.log(`[Scraper] Received Command: ${request.action}`);

            if (request.action === "START_SCRAPE") {
                this.startHomeScrape(request.limit);
                sendResponse({ status: "started_home" });
            }
            else if (request.action === "START_CRAWL") {
                // "Deep Crawl (Auto)" button triggers this.
                // It means: Start Home Scrape (Limit 20), THEN auto-transition.
                this.startHomeScrape(request.limit || 20);
                sendResponse({ status: "started_crawl_sequence" });
            }
            else if (request.action === "STOP_SCRAPE") {
                this.stop();
                sendResponse({ status: "stopped" });
            }
        });
    }

    // ================= PHASE 1: HOME SCRAPE =================

    async startDeepCrawl(queue) {
        console.log("[Scraper] Saving Queue and Starting Phase 2...");
        this.updateDashboard(`Phase 1 Done. Starting Phase 2: ${queue.length} Markets...`);
        await chrome.storage.local.set({
            isCrawling: true,
            crawlQueue: queue
        });
        window.location.href = queue[0];
    }

    createDashboard() {
        if (document.getElementById('poly-scraper-status')) return;
        const div = document.createElement('div');
        div.id = 'poly-scraper-status';
        div.style.cssText = `
            position: fixed; 
            top: 10px; 
            right: 10px; 
            background: rgba(0,0,0,0.8); 
            color: #00ff00; 
            padding: 15px; 
            z-index: 999999; 
            font-family: monospace; 
            font-size: 16px; 
            border-radius: 8px; 
            border: 2px solid #00ff00;
            box-shadow: 0 0 10px rgba(0,255,0,0.2);
        `;
        div.innerText = "Polymarket Scraper: Idle";
        document.body.appendChild(div);
    }

    updateDashboard(text) {
        const div = document.getElementById('poly-scraper-status');
        if (div) div.innerText = text;
        else {
            this.createDashboard();
            document.getElementById('poly-scraper-status').innerText = text;
        }
    }

    // ================= PHASE 1: HOME SCRAPE =================

    startHomeScrape(limit = 1000) {
        if (this.isScraping) return;
        this.isScraping = true;
        this.uniqueLimit = limit + this.marketSet.size;

        this.createDashboard();
        this.updateDashboard(`🚀 Phase 1: Scanning for ${limit} Markets... (Found: 0)`);

        console.log(`[Scraper] Starting Phase 1: ${this.uniqueLimit} target.`);

        this.observer = new MutationObserver(() => this.extractMarkets());
        this.observer.observe(document.body, { childList: true, subtree: true });

        this.scrollInterval = setInterval(() => {
            window.scrollTo(0, document.body.scrollHeight);
            if (this.marketSet.size >= this.uniqueLimit) this.finishHomeScrape();
        }, 800);
    }

    extractMarkets() {
        // Broadened selector
        const links = document.querySelectorAll('a[href*="/event/"], a[href*="/market/"], a[href*="polymarket.com/event"]');
        const batch = [];

        links.forEach(link => {
            try {
                const url = link.href;
                const marketId = url.split('/').pop().split('?')[0];

                if (this.marketSet.has(marketId)) return;

                // Simple visible title check
                let title = link.innerText.split('\n')[0].trim();
                // Fallback to finding a header nearby if link is just a wrapper
                if (!title || title.length < 5) {
                    const h = link.querySelector('h3, h4, div[class*="Title"]');
                    if (h) title = h.innerText.trim();
                }

                if (!marketId || !title) return;

                this.marketSet.add(marketId);
                this.scrapedUrls.add(url);

                this.updateDashboard(`🔎 Found: ${this.marketSet.size} / ${this.uniqueLimit}`);

                batch.push({
                    market_id: marketId, title: title, market_url: url,
                    resolution_time: null, yes_price: 0, no_price: 0,
                    liquidity: '0', volume: '0'
                });
            } catch (err) { }
        });

        if (batch.length > 0) this.sendData(batch);
    }

    finishHomeScrape() {
        this.stop();
        this.updateDashboard(`✅ Phase 1 Done! Found ${this.scrapedUrls.size}. prompting...`);
        console.log(`[Scraper] Phase 1 Complete. Collected ${this.scrapedUrls.size} URLs.`);

        const queue = Array.from(this.scrapedUrls);
        if (confirm(`Phase 1 Done! ${queue.length} markets found.\n\nStart Phase 2 (Deep Crawl)?`)) {
            this.startDeepCrawl(queue);
        }
    }

    async handleDeepCrawl(queue) {
        this.createDashboard();
        if (queue.length === 0) {
            this.updateDashboard("✅ Mission Complete!");
            chrome.storage.local.set({ isCrawling: false });
            alert("Mission Complete: All markets scraped!");
            return;
        }

        const msg = `🕷️ Deep Crawling... (${queue.length} Left)\nID: ${window.location.href.split('/').pop()}`;
        this.updateDashboard(msg);
        console.log(msg);

        const safetyTimer = setTimeout(() => {
            console.warn("[Scraper] Safety Timer! Moving Next.");
            this.forceNext(queue);
        }, 15000);

        try {
            // 1. Click "Activity" Tab
            await this.clickActivityTab();
            await new Promise(r => setTimeout(r, 2000)); // Wait for render

            // 2. Extract Data
            const count = this.extractActivity();

            // 3. Retry if empty (maybe scroll slightly)
            if (count === 0) {
                window.scrollBy(0, 300);
                await new Promise(r => setTimeout(r, 1000));
                this.extractActivity();
            }

        } catch (e) {
            console.error("[Scraper] Error:", e);
        } finally {
            clearTimeout(safetyTimer);
            this.forceNext(queue);
        }
    }

    async clickActivityTab() {
        const buttons = Array.from(document.querySelectorAll('button, div[role="tab"]'));
        const activityBtn = buttons.find(b => b.innerText.includes("Activity"));
        if (activityBtn) {
            console.log("[Scraper] Clicking 'Activity' Tab...");
            activityBtn.click();
            return true;
        }
        return false;
    }

    extractActivity() {
        const currentMarketId = window.location.href.split('/').pop().split('?')[0];
        const activityBatch = [];

        // Target specifically the rows in the screenshot
        // We look for list items or divs that contain "bought" or "sold"
        const rows = document.querySelectorAll('div[class*="ListItem"], li, div[role="listitem"], .c-table__row');

        rows.forEach(row => {
            const text = row.innerText.replace(/\n/g, ' ');
            // Regex based on screenshot: "Rayleignfb bought 988 No for ... at 98.2c ($970)"
            const regex = /(.+?)\s+(bought|sold)\s+([\d\.]+)\s+(Yes|No).*?at\s+([\d\.]+)[¢\$].*?\(\$([\d\.,]+)\)/i;
            const match = text.match(regex);

            if (match) {
                const username = match[1].trim();
                const action = match[2].toLowerCase();
                const shares = parseFloat(match[3]);
                const outcome = match[4];
                let price = parseFloat(match[5]);
                if (price > 1) price = price / 100;
                const amount = parseFloat(match[6].replace(/,/g, ''));

                const hashString = `${currentMarketId}-${username}-${amount}-${action}-${Date.now()}-${Math.random()}`;
                const transactionHash = btoa(hashString).substring(0, 32);

                activityBatch.push({
                    transaction_hash: transactionHash,
                    market_id: currentMarketId,
                    username: username,
                    action: action,
                    outcome: outcome,
                    amount: amount,
                    price: price,
                    timestamp: Date.now() / 1000
                });
            }
        });

        if (activityBatch.length > 0) {
            console.log(`[Scraper] Found ${activityBatch.length} trades.`);
            chrome.runtime.sendMessage({ type: 'DATA_ACTIVITY', payload: activityBatch });
            return activityBatch.length;
        }
        return 0;
    }

    stop() {
        this.isScraping = false;
        chrome.storage.local.set({ isCrawling: false, crawlQueue: [] }); // Clear state
        if (this.observer) this.observer.disconnect();
        if (this.scrollInterval) clearInterval(this.scrollInterval);
    }

    sendData(markets) {
        chrome.runtime.sendMessage({
            type: 'DATA_SCRAPED',
            payload: markets,
            totalUnique: this.marketSet.size
        });
    }
}

const scraper = new Scraper();
// Delay init slightly to ensure storage is ready
setTimeout(() => scraper.init(), 1000);
