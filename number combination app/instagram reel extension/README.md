# Instagram Reel Downloader & Twitter Scheduler

A Brave/Chrome browser extension that downloads Instagram reels and schedules them for posting to Twitter.

## Features

- 📥 **One-Click Download**: Download button on every Instagram reel
- 📁 **Auto-Save**: Videos saved to `C:\Users\instagram videos\` with sequential naming (1.mp4, 2.mp4, ...)
- 📋 **Queue System**: Review downloaded videos before scheduling
- ⏰ **Scheduled Posting**: Post to Twitter with 1-hour intervals
- 🎨 **Modern UI**: Dark theme popup interface

## Installation

1. Open **Brave** browser
2. Go to `brave://extensions`
3. Enable **Developer mode** (toggle in top-right)
4. Click **Load unpacked**
5. Select this extension folder

## Usage

### Downloading Reels

1. Go to [Instagram Reels](https://www.instagram.com/reels/)
2. Find a reel you want to download
3. Click the **purple download button** that appears on the reel
4. Video will be saved automatically

### Managing Queue

1. Click the extension icon in the toolbar
2. View all downloaded reels in the **Queue** tab
3. Click ✓ to **approve** a reel for scheduling
4. Click 🗑️ to **delete** a reel

### Scheduling to Twitter

1. Switch to the **Scheduled** tab
2. Click **Start Scheduling**
3. The extension will:
   - Open Twitter compose page
   - Show instructions to upload the video
   - Wait for you to complete the post
   - Schedule the next post in 1 hour

## File Structure

```
instagram reel extension/
├── manifest.json           # Extension configuration
├── icons/                  # Extension icons
├── background/
│   └── service-worker.js   # Download & scheduling logic
├── content/
│   ├── instagram.js        # Reel detection & button injection
│   ├── instagram.css       # Download button styles
│   └── twitter.js          # Twitter posting automation
└── popup/
    ├── popup.html          # Queue management UI
    ├── popup.css           # Popup styling
    └── popup.js            # Queue & scheduling controls
```

## Notes

- Keep Brave open for scheduled posts to work
- You must be logged into Twitter/X
- Videos are saved to: `C:\Users\instagram videos\`

## Troubleshooting

**Download button not appearing?**
- Refresh the Instagram page
- Make sure you're viewing reels (video content)

**Scheduling not working?**
- Ensure you're logged into Twitter/X
- Check that there are approved videos in the Scheduled tab

---

*Made for local use only*
