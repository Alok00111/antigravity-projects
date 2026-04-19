CREATE TABLE IF NOT EXISTS markets (
    market_id VARCHAR(255) PRIMARY KEY,
    title TEXT NOT NULL,
    market_url TEXT NOT NULL,
    resolution_time VARCHAR(255),
    first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS market_snapshots (
    snapshot_id INT AUTO_INCREMENT PRIMARY KEY,
    market_id VARCHAR(255) NOT NULL,
    yes_price DECIMAL(5, 4),
    no_price DECIMAL(5, 4),
    liquidity VARCHAR(255),
    volume VARCHAR(255),
    scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (market_id) REFERENCES markets(market_id)
);

CREATE TABLE IF NOT EXISTS detected_trades (
    trade_id INT AUTO_INCREMENT PRIMARY KEY,
    market_id VARCHAR(255) NOT NULL,
    old_yes_price DECIMAL(5, 4),
    new_yes_price DECIMAL(5, 4),
    old_no_price DECIMAL(5, 4),
    new_no_price DECIMAL(5, 4),
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reason VARCHAR(255) DEFAULT 'price movement',
    FOREIGN KEY (market_id) REFERENCES markets(market_id)
);

CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
