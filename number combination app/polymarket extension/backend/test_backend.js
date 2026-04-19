const http = require('http');

function postData(data) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(data);
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/scrape',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve(JSON.parse(body)));
        });

        req.on('error', (e) => reject(e));
        req.write(postData);
        req.end();
    });
}

async function runTest() {
    console.log("Starting Backend Logic Test...");

    const marketId = "test-market-" + Date.now();

    // Step 1: Initial Scrape
    console.log(`\n1. Sending initial snapshot for market: ${marketId}`);
    const initialData = {
        markets: [{
            market_id: marketId,
            title: "Test Market: Will it rain?",
            market_url: `https://polymarket.com/market/${marketId}`,
            yes_price: 0.50,
            no_price: 0.50,
            liquidity: "$1000",
            volume: "$500"
        }]
    };

    try {
        const res1 = await postData(initialData);
        console.log("Response:", res1);
    } catch (e) {
        console.error("Failed to connect to backend. Is it running?", e.message);
        return;
    }

    // Step 2: Price Change (Trade)
    console.log(`\n2. Sending UPDATED snapshot (Price Change)`);
    const updatedData = {
        markets: [{
            market_id: marketId,
            title: "Test Market: Will it rain?",
            market_url: `https://polymarket.com/market/${marketId}`,
            yes_price: 0.60, // Changed from 0.50
            no_price: 0.40,  // Changed from 0.50
            liquidity: "$1200",
            volume: "$600"
        }]
    };

    try {
        const res2 = await postData(updatedData);
        console.log("Response:", res2);
        console.log("Check 'detected_trades' table in MySQL to verify a trade was recorded.");
    } catch (e) {
        console.error("Error:", e.message);
    }
}

runTest();
