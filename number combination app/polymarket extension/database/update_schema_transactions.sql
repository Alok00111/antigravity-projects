CREATE TABLE IF NOT EXISTS user_transactions (
    transaction_hash VARCHAR(255) PRIMARY KEY, -- Unique ID from Polymarket (or hash of fields)
    user_id INT,
    market_id VARCHAR(255),
    action VARCHAR(50), -- 'Buy', 'Sell'
    outcome VARCHAR(10), -- 'Yes', 'No'
    amount DECIMAL(18, 4),
    price DECIMAL(5, 4),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (market_id) REFERENCES markets(market_id)
);
