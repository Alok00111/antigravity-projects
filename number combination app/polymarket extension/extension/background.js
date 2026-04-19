// background.js

let uniqueMarketsCount = 0;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'DATA_ACTIVITY') {
        fetch('http://localhost:3000/api/activity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ activities: message.payload })
        })
            .then(res => res.json())
            .then(data => console.log('Activity sent:', data))
            .catch(err => console.error('Activity send failed:', err));

        return true;
    }

    if (message.type === 'DATA_SCRAPED') {
        const markets = message.payload;

        // Update badge
        uniqueMarketsCount = message.totalUnique;
        chrome.action.setBadgeText({ text: uniqueMarketsCount.toString() });
        chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });

        // Send to backend
        fetch('http://localhost:3000/api/scrape', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ markets: markets })
        })
            .then(response => response.json())
            .then(data => {
                console.log('Backend response:', data);
                sendResponse({ status: 'success', data: data });
            })
            .catch(error => {
                console.error('Backend error:', error);
                sendResponse({ status: 'error', error: error.toString() });
            });

        return true; // Keep message channel open for async response
    }
});
