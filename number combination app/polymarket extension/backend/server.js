const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' })); // Allow large payloads

// Helper to detect trades
async function detectTrade(marketId, newYes, newNo, snapshotTime) {
    try {
        // Get the last snapshot for this market
        const [rows] = await db.query(
            `SELECT * FROM market_snapshots WHERE market_id = ? ORDER BY scraped_at DESC LIMIT 1`,
            [marketId]
        );

        if (rows.length === 0) return; // No history, can't detect change

        const lastSnapshot = rows[0];

        // Simple significant change detection (e.g., > 0.01 difference) or strictly any change? 
        // User asked for "significantly between two snapshots" -> let's define "significant" as any price change for now as these are prediction markets.
        const yesChanged = parseFloat(newYes) !== parseFloat(lastSnapshot.yes_price);
        const noChanged = parseFloat(newNo) !== parseFloat(lastSnapshot.no_price);

        if (yesChanged || noChanged) {
            await db.query(
                `INSERT INTO detected_trades (market_id, old_yes_price, new_yes_price, old_no_price, new_no_price, detected_at, reason) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    marketId,
                    lastSnapshot.yes_price,
                    newYes,
                    lastSnapshot.no_price,
                    newNo,
                    snapshotTime,
                    'price movement'
                ]
            );
            console.log(`[TRADE DETECTED] Market: ${marketId} | YES: ${lastSnapshot.yes_price} -> ${newYes}`);
        }
    } catch (err) {
        console.error('Error detecting trade:', err);
    }
}

app.post('/api/scrape', async (req, res) => {
    const markets = req.body.markets; // Expecting array of market objects
    if (!markets || !Array.isArray(markets)) {
        return res.status(400).json({ error: 'Invalid data format' });
    }

    console.log(`Received scrape data for ${markets.length} markets`);
    const snapshotTime = new Date(); // Use server time for consistency

    try {
        for (const market of markets) {
            // 1. Upsert Market
            await db.query(
                `INSERT INTO markets (market_id, title, market_url, resolution_time) 
                 VALUES (?, ?, ?, ?) 
                 ON DUPLICATE KEY UPDATE title = VALUES(title), resolution_time = VALUES(resolution_time)`,
                [market.market_id, market.title, market.market_url, market.resolution_time]
            );

            // 2. Detect Trade (Compare with previous BEFORE inserting new snapshot)
            await detectTrade(market.market_id, market.yes_price, market.no_price, snapshotTime);

            // 3. Insert Snapshot
            await db.query(
                `INSERT INTO market_snapshots (market_id, yes_price, no_price, liquidity, volume, scraped_at) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [market.market_id, market.yes_price, market.no_price, market.liquidity, market.volume, snapshotTime]
            );
        }

        res.json({ message: 'Data processed successfully', count: markets.length });
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Database processing failed' });
    }
});

// NEW: Endpoint for User Activity (Deep Scrape)
app.post('/api/activity', async (req, res) => {
    const activities = req.body.activities;
    if (!activities || !Array.isArray(activities)) {
        return res.status(400).json({ error: 'Invalid data format' });
    }

    console.log(`Received ${activities.length} activity items`);
    let addedCount = 0;

    try {
        for (const act of activities) {
            // 1. Ensure User Exists
            let userId = null;
            if (act.username) {
                const [uRows] = await db.query('SELECT user_id FROM users WHERE username = ?', [act.username]);
                if (uRows.length > 0) {
                    userId = uRows[0].user_id;
                } else {
                    const [res] = await db.query('INSERT INTO users (username) VALUES (?)', [act.username]);
                    userId = res.insertId;
                }
            }

            // 2. Insert Transaction (Ignore if market missing for now, or ensure market exists?)
            // We'll use INSERT IGNORE to skip duplicates based on transaction_hash
            await db.query(
                `INSERT IGNORE INTO user_transactions 
                (transaction_hash, user_id, market_id, action, outcome, amount, price, timestamp) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    act.transaction_hash,
                    userId,
                    act.market_id,
                    act.action,
                    act.outcome,
                    act.amount,
                    act.price,
                    new Date(act.timestamp * 1000) // Assuming unix timestamp
                ]
            );
            addedCount++;
        }
        res.json({ message: 'Activity processed', count: addedCount });
    } catch (err) {
        console.error('Activity DB Error:', err);
        res.status(500).json({ error: 'Failed to process activity' });
    }
});

app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});
