// popup.js
document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const resumeBtn = document.getElementById('resumeBtn');
    const countDisplay = document.getElementById('marketCount');
    const statusText = document.getElementById('statusText');

    // Get current count from badge logic or storage (mocking simple retrieve here)
    // In a real app we'd query storage

    const crawlBtn = document.getElementById('crawlBtn');

    startBtn.addEventListener('click', () => {
        sendMessageToContent({ action: "START_SCRAPE", limit: 1000 });
        statusText.innerText = "Home Scraping...";
    });

    crawlBtn.addEventListener('click', () => {
        // Send start crawl command
        sendMessageToContent({ action: "START_CRAWL", limit: 10 });
        statusText.innerText = "Crawling 10 Markets...";
    });

    stopBtn.addEventListener('click', () => {
        sendMessageToContent({ action: "STOP_SCRAPE" });
        statusText.innerText = "Stopped.";
    });

    resumeBtn.addEventListener('click', () => {
        sendMessageToContent({ action: "CONTINUE_SCRAPE" });
        resumeBtn.style.display = 'none';
        statusText.innerText = "Scraping additional...";
    });

    // Listen for messages from content/background
    chrome.runtime.onMessage.addListener((message) => {
        if (message.type === 'DATA_SCRAPED') {
            countDisplay.innerText = message.totalUnique;
        } else if (message.type === 'BATCH_COMPLETE') {
            statusText.innerText = "Batch Complete!";
            resumeBtn.style.display = 'block';
            countDisplay.innerText = message.count;
        }
    });

    function sendMessageToContent(msg) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, msg);
            } else {
                statusText.innerText = "No active tab found.";
            }
        });
    }
});
