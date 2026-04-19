const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const logs = [];
  page.on('console', msg => {
    logs.push(`[CONSOLE ${msg.type()}] ${msg.text()}`);
    console.log(`[CONSOLE ${msg.type()}] ${msg.text()}`);
  });
  page.on('pageerror', error => {
    console.log(`[PAGE ERROR] ${error.message}`);
    console.log(error.stack);
  });
  page.on('requestfailed', request => {
    console.log(`[REQUEST FAILED] ${request.url()} — ${request.failure()?.errorText}`);
  });

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  console.log("--- PAGE LOADED ---");
  
  await page.fill('#nameInput', 'testplayer');
  console.log("--- NAME FILLED ---");
  
  await page.click('#btnQuickPlay');
  console.log("--- BUTTON CLICKED ---");
  
  await page.waitForTimeout(3000);
  console.log("--- DONE WAITING ---");
  
  const currentUrl = page.url();
  console.log("Current URL:", currentUrl);

  await browser.close();
})();
