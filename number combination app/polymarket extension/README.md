# Polymarket Real-Time Scraper

## Prerequisites
- Node.js (v14+)
- MySQL Server
- Google Chrome

## 1. Database Setup
1. Open your MySQL client (Workbench, Command Line, etc.).
2. Create a database (e.g., `polymarket_db`).
3. Run the script `database/schema.sql` to create the validation tables.

## 2. Backend Setup
1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Create a `.env` file (or rename `.env.example` if applicable) with your credentials:
   ```
   DB_HOST=localhost
   DB_USER=your_user
   DB_PASSWORD=your_password
   DB_NAME=polymarket_db
   PORT=3000
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the server:
   ```bash
   node server.js
   ```

## 3. Extension Setup
1. Open Chrome and go to `chrome://extensions`.
2. Enable **Developer Mode** (top right).
3. Click **Load unpacked**.
4. Select the `extension` folder in this project.
5. (Optional) If you see a warning about missing `icon.png`, you can add one or ignore it.

## 4. Usage
1. Go to [Polymarket.com](https://polymarket.com).
2. Click the extension icon.
3. Click **Start**.
4. The page will auto-scroll, and the extension will collect markets.
5. Use the **Stop** button or wait for the 1000 limit to see the popup.

## 5. Notes
- The scraper relies on DOM structure. If Polymarket changes their layout significantly, `content.js` selectors may need updating.
- Data is stored in `market_snapshots`. Trade detection happens automatically on every scrape if prices change.
