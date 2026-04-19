// Twitter Automation - Handles video upload + scheduling on X.com

(function () {
    console.log('[AutoPoster] Content script loaded');

    // Debug overlay
    const box = document.createElement('div');
    box.style.cssText = `
        position: fixed; top: 10px; left: 10px; background: rgba(0,0,0,0.92);
        color: #0f0; padding: 12px 16px; z-index: 999999; border: 1px solid #0f0;
        font-family: 'Consolas', monospace; font-size: 13px; max-width: 400px;
        border-radius: 8px; backdrop-filter: blur(8px); line-height: 1.5;
        box-shadow: 0 4px 20px rgba(0,255,0,0.1);
    `;
    box.id = 'debug-status';
    box.innerText = '⏳ Waiting for command...';
    document.body.appendChild(box);

    function log(msg) {
        console.log('[AutoPoster]', msg);
        box.innerText = msg;
    }

    function logError(msg) {
        console.error('[AutoPoster]', msg);
        box.style.color = '#f44';
        box.style.borderColor = '#f44';
        box.innerText = '❌ ' + msg;
    }

    function logSuccess(msg) {
        console.log('[AutoPoster]', msg);
        box.style.color = '#4f4';
        box.style.borderColor = '#4f4';
        box.innerText = '✅ ' + msg;
    }

    // Listen for job commands from the service worker
    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
        if (msg.action === 'START_JOB') {
            log('📦 Job received: ' + msg.video.filename);
            runJob(msg.video, msg.videoIndex || 0, msg.hourGap || 1, msg.baseTime);
            sendResponse({ received: true });
        }
        if (msg.action === 'PING') {
            sendResponse({ alive: true });
        }
    });

    async function runJob(video, videoIndex, hourGap, baseTime) {
        try {
            // Step 0: Clean up any leftover compose dialog from previous job
            log('0️⃣ Cleaning up...');
            await tryCloseDialogs();
            await wait(1500);

            // Step 1: Click the compose/post button
            log('1️⃣ Opening compose box...');
            const btn = document.querySelector('[data-testid="SideNav_NewTweet_Button"]');
            if (btn) {
                btn.click();
            } else {
                const altBtn = document.querySelector('a[href="/compose/post"]');
                if (altBtn) altBtn.click();
                else throw new Error('Post button not found! Make sure X.com is fully loaded.');
            }

            // Step 2: Wait for compose dialog (modal overlay)
            log('2️⃣ Waiting for compose box...');
            await waitForElement('[data-testid="tweetTextarea_0"]', 8000);
            await wait(1000);

            // Step 3: Fetch video from local server
            log('3️⃣ Fetching video: ' + video.filename);
            const videoData = await new Promise((resolve, reject) => {
                chrome.runtime.sendMessage({ action: 'fetchVideo', filename: video.filename }, (response) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error('Message error: ' + chrome.runtime.lastError.message));
                        return;
                    }
                    if (response && response.success) resolve(response);
                    else reject(new Error(response?.error || 'Failed to fetch video from server'));
                });
            });
            const sizeMB = (videoData.size / 1024 / 1024).toFixed(2);
            log(`3️⃣ Fetched: ${sizeMB} MB`);

            // Step 4: Inject the file into Twitter's file input
            log('4️⃣ Injecting video file...');
            const blob = await fetch(videoData.data).then(r => r.blob());
            const file = new File([blob], video.filename, { type: 'video/mp4' });

            const fileInput = document.querySelector('input[type="file"][data-testid="fileInput"]') ||
                document.querySelector('input[type="file"]');
            if (!fileInput) throw new Error('File input not found in compose dialog!');

            const dt = new DataTransfer();
            dt.items.add(file);
            fileInput.files = dt.files;
            fileInput.dispatchEvent(new Event('change', { bubbles: true }));

            // Step 5: Wait for upload to complete
            log('5️⃣ Uploading video... (this may take a while)');
            await waitForUpload();
            log('5️⃣ Upload complete!');

            // Step 6: Click the Schedule icon to open date picker
            log('6️⃣ Opening schedule dialog...');
            await wait(800);

            const scheduleIcon = document.querySelector('[data-testid="scheduleOption"]') ||
                document.querySelector('[aria-label="Schedule"]') ||
                findButtonByAriaLabel('Schedule');
            if (!scheduleIcon) throw new Error('Schedule button/icon not found!');
            scheduleIcon.click();

            // Wait for the schedule date picker dialog to actually appear
            log('6️⃣ Waiting for date picker to load...');
            await waitForScheduleDialog(15000);
            log('6️⃣ Date picker is open!');

            // Step 7: Calculate the schedule time
            // baseTime = exactly when scheduling started (Date.now() at that moment)
            // Each video is offset by hourGap: video 0 = baseTime + hourGap*1, video 1 = baseTime + hourGap*2, etc.
            const totalHoursOffset = hourGap * (videoIndex + 1);
            const scheduleMs = (baseTime || Date.now()) + (totalHoursOffset * 60 * 60 * 1000);
            const scheduleTime = new Date(scheduleMs);
            log(`7️⃣ Gap: ${hourGap}h × video #${videoIndex + 1} = +${totalHoursOffset}h`);
            log(`7️⃣ Current time: ${new Date().toLocaleString()}`);

            log('7️⃣ Setting schedule: ' + scheduleTime.toLocaleString());
            await setScheduleTime(scheduleTime);

            await wait(800);

            // Step 8: Click "Confirm" / "Update" in the schedule date picker
            log('8️⃣ Confirming schedule date/time...');
            await wait(1000);

            // Retry clicking Confirm up to 8 times with recovery
            let confirmed = false;
            for (let attempt = 1; attempt <= 8; attempt++) {
                confirmed = await clickConfirmButton();
                if (confirmed) {
                    log('8️⃣ Confirmed! (attempt ' + attempt + ')');
                    break;
                }
                log('8️⃣ Confirm not found, retrying (' + attempt + '/8)...');

                // On attempt 4, try re-opening the schedule dialog as recovery
                if (attempt === 4) {
                    log('8️⃣ Recovery: re-opening schedule dialog...');
                    // Try pressing Escape first to close any stuck state
                    document.dispatchEvent(new KeyboardEvent('keydown', {
                        key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true
                    }));
                    await wait(1000);

                    // Re-click schedule icon
                    const retryScheduleIcon = document.querySelector('[data-testid="scheduleOption"]') ||
                        document.querySelector('[aria-label="Schedule"]') ||
                        findButtonByAriaLabel('Schedule');
                    if (retryScheduleIcon) {
                        retryScheduleIcon.click();
                        await wait(2000);
                        await waitForScheduleDialog(10000);
                        await setScheduleTime(scheduleTime);
                        await wait(1000);
                    }
                }

                await wait(2000);
            }
            if (!confirmed) throw new Error('Confirm/Update button not found in schedule dialog!');

            // Wait for the date picker to close and compose view to show "Will send on..."
            log('8️⃣ Waiting for date picker to close...');
            await wait(2000);

            // Verify we're back to compose view (should see "Will send on" text)
            const composeArea = document.querySelector('[data-testid="tweetTextarea_0"]');
            if (!composeArea) {
                log('8️⃣ ⚠️ Compose area not found, waiting longer...');
                await wait(2000);
            }

            // Step 9: Click the "Schedule" button (bottom-right of compose view)
            log('9️⃣ Looking for Schedule button...');
            await wait(1000);

            // The Schedule button should be the main action button after setting a schedule
            // It might still have data-testid="tweetButton" but text changes to "Schedule"
            let schedulePostBtn = document.querySelector('[data-testid="tweetButton"]');

            // If not found, try by text
            if (!schedulePostBtn) {
                const allBtns = document.querySelectorAll('button, [role="button"]');
                for (const btn of allBtns) {
                    const text = btn.textContent.trim();
                    if (text === 'Schedule' && btn.closest('[data-testid="toolBar"]')?.parentElement) {
                        schedulePostBtn = btn;
                        break;
                    }
                }
            }

            if (!schedulePostBtn) {
                // One more try: look for the blue button at bottom of compose
                const btns = document.querySelectorAll('[data-testid="tweetButtonInline"], [data-testid="tweetButton"]');
                schedulePostBtn = btns[btns.length - 1] || null;
            }

            if (!schedulePostBtn) throw new Error('Schedule/Post button not found! The compose view may not have loaded properly.');

            log('9️⃣ Found button: "' + schedulePostBtn.textContent.trim() + '"');

            // Make sure button is enabled
            if (schedulePostBtn.disabled || schedulePostBtn.getAttribute('aria-disabled') === 'true') {
                log('9️⃣ Waiting for button to enable...');
                await waitForButtonEnabled(schedulePostBtn, 10000);
            }

            schedulePostBtn.click();
            log('9️⃣ Clicked Schedule button!');

            // Step 10: Wait for the compose dialog to close (post submitted)
            log('🔟 Waiting for post to submit...');
            await waitForDialogClose(15000);

            // SUCCESS
            logSuccess(`Scheduled: ${video.filename} for ${scheduleTime.toLocaleTimeString()}`);

            // Notify service worker of success
            chrome.runtime.sendMessage({
                action: 'twitterPostComplete',
                success: true,
                filename: video.filename
            });

        } catch (e) {
            logError(e.message);
            console.error('[AutoPoster] Full error:', e);

            // Try to close any open dialogs to reset state
            await tryCloseDialogs();

            // Notify service worker of failure
            chrome.runtime.sendMessage({
                action: 'twitterPostComplete',
                success: false,
                filename: video.filename,
                error: e.message
            });
        }
    }

    // --- Schedule Time Setter ---

    async function setScheduleTime(date) {
        const months = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        const month = months[date.getMonth()];
        const monthNum = date.getMonth() + 1; // 1-based month number
        const day = date.getDate();
        const year = date.getFullYear();

        let hour24 = date.getHours();
        const ampm = hour24 >= 12 ? 'PM' : 'AM';
        let hour12 = hour24 % 12;
        if (hour12 === 0) hour12 = 12;
        const minute = date.getMinutes();

        console.log('[AutoPoster] Target schedule:', { month, monthNum, day, year, hour12, minute, ampm, hour24 });
        log(`7️⃣ Target: ${month} ${day}, ${year} ${hour12}:${minute < 10 ? '0' + minute : minute} ${ampm}`);

        const dialog = document.querySelector('[role="dialog"]');
        if (!dialog) {
            throw new Error('Schedule dialog not found!');
        }

        const selects = dialog.querySelectorAll('select');
        console.log('[AutoPoster] Found', selects.length, 'select elements');

        // Log ALL select options for debugging
        for (let i = 0; i < selects.length; i++) {
            const sel = selects[i];
            const opts = Array.from(sel.options).map(o => ({ value: o.value, text: o.text.trim() }));
            console.log(`[AutoPoster] Select #${i} (current="${sel.value}"):`, JSON.stringify(opts));
        }

        if (selects.length === 0) {
            throw new Error('No select dropdowns found in schedule dialog!');
        }

        // Classify each select using LABEL-BASED detection first (most reliable)
        // X labels each select with: "Month", "Day", "Year", "Hour", "Minute", "AM/PM"
        let monthSelect, daySelect, yearSelect, hourSelect, minuteSelect, ampmSelect;

        function getSelectLabel(select) {
            // Strategy 1: aria-label on the select itself
            const ariaLabel = select.getAttribute('aria-label');
            if (ariaLabel) return ariaLabel.trim().toLowerCase();

            // Strategy 2: associated <label> via id
            const id = select.id;
            if (id) {
                const label = dialog.querySelector(`label[for="${id}"]`);
                if (label) return label.textContent.trim().toLowerCase();
            }

            // Strategy 3: parent or sibling label text
            const parent = select.parentElement;
            if (parent) {
                const label = parent.querySelector('label');
                if (label) return label.textContent.trim().toLowerCase();
                // Check for preceding sibling text (span, div, label)
                const prev = select.previousElementSibling;
                if (prev && prev.textContent.trim().length < 20) {
                    return prev.textContent.trim().toLowerCase();
                }
            }

            // Strategy 4: grandparent label (X wraps selects in divs)
            const grandparent = parent?.parentElement;
            if (grandparent) {
                const label = grandparent.querySelector('label');
                if (label) return label.textContent.trim().toLowerCase();
            }

            return '';
        }

        // First pass: try label-based identification
        for (const select of selects) {
            const label = getSelectLabel(select);
            console.log('[AutoPoster] Select label detected:', JSON.stringify(label), 'for select with value:', select.value);

            if (label.includes('month')) { monthSelect = select; continue; }
            if (label === 'day') { daySelect = select; continue; }
            if (label.includes('year')) { yearSelect = select; continue; }
            if (label.includes('hour')) { hourSelect = select; continue; }
            if (label.includes('minute')) { minuteSelect = select; continue; }
            if (label.includes('am') || label.includes('pm') || label.includes('am/pm')) { ampmSelect = select; continue; }
        }

        // Second pass: for any unidentified selects, use value-based analysis as fallback
        for (const select of selects) {
            // Skip already identified selects
            if (select === monthSelect || select === daySelect || select === yearSelect ||
                select === hourSelect || select === minuteSelect || select === ampmSelect) continue;

            const options = Array.from(select.options);
            const texts = options.map(o => o.text.trim());
            const values = options.map(o => o.value.trim());

            // AM/PM: has AM or PM options
            if (!ampmSelect && (values.includes('AM') || values.includes('PM') || texts.includes('AM') || texts.includes('PM'))) {
                ampmSelect = select;
                continue;
            }

            // Month: contains month names
            if (!monthSelect && (texts.includes('January') || texts.includes('February') || texts.includes('March'))) {
                monthSelect = select;
                continue;
            }

            // Year: contains 4-digit year values
            if (!yearSelect && values.some(v => /^20\d\d$/.test(v))) {
                yearSelect = select;
                continue;
            }

            // For remaining selects, distinguish hour/day/minute by numeric analysis
            const numericValues = values.map(v => parseInt(v)).filter(n => !isNaN(n));
            if (numericValues.length === 0) continue;
            const maxVal = Math.max(...numericValues);
            const minVal = Math.min(...numericValues);

            if (!hourSelect && maxVal === 12 && minVal >= 1 && options.length <= 12) {
                // Hour: 1-12 (12 options, starts at 1)
                hourSelect = select;
            } else if (!minuteSelect && minVal === 0) {
                // Minute: starts at 0 (day never starts at 0)
                // X uses 5-min intervals: 0, 5, 10, ..., 55
                minuteSelect = select;
            } else if (!daySelect && minVal >= 1 && maxVal >= 28) {
                // Day: starts at 1, goes up to 28-31
                daySelect = select;
            } else if (!minuteSelect) {
                minuteSelect = select;
            } else if (!daySelect) {
                daySelect = select;
            }
        }

        console.log('[AutoPoster] Identified selects:', {
            month: !!monthSelect, day: !!daySelect, year: !!yearSelect,
            hour: !!hourSelect, minute: !!minuteSelect, ampm: !!ampmSelect
        });

        // ============================================================
        // SET VALUES IN CORRECT ORDER:
        //   1. Month (first, since it determines available days)
        //   2. Day
        //   3. Year
        //   4. Hour
        //   5. Minute
        //   6. AM/PM (LAST — setting it before hour causes React to reset it)
        // Wait 700ms between each to let React process state changes
        // ============================================================

        if (monthSelect) {
            // X's month select may use numeric values (e.g., "2" for February)
            // or text-based months. Try to find the option by month name OR number.
            const monthOpts = Array.from(monthSelect.options);
            const monthByName = monthOpts.find(o => o.text.trim() === month);
            const monthByNum = monthOpts.find(o => parseInt(o.value) === monthNum);

            if (monthByName) {
                // Use the option's actual value (could be numeric like "2" or text like "February")
                await setSelectValue(monthSelect, monthByName.value, month);
                console.log('[AutoPoster] Set month via name match:', month, '→ value:', monthByName.value);
            } else if (monthByNum) {
                await setSelectValue(monthSelect, monthByNum.value, monthByNum.text.trim());
                console.log('[AutoPoster] Set month via numeric match:', monthNum, '→ value:', monthByNum.value);
            } else {
                // Fallback: try both name and number
                await setSelectValue(monthSelect, month, month);
                console.warn('[AutoPoster] ⚠️ Month fallback attempt with:', month);
            }
            await wait(700);
        }

        if (daySelect) {
            // Day values in X are typically "1", "2", ... "31"
            await setSelectValue(daySelect, day.toString(), day.toString());
            console.log('[AutoPoster] Set day:', day);
            await wait(700);
        }

        if (yearSelect) {
            await setSelectValue(yearSelect, year.toString(), year.toString());
            console.log('[AutoPoster] Set year:', year);
            await wait(700);
        }

        if (hourSelect) {
            // X uses 12-hour format: values are "1" through "12"
            await setSelectValue(hourSelect, hour12.toString(), hour12.toString());
            console.log('[AutoPoster] Set hour:', hour12);
            await wait(700);
        }

        if (minuteSelect) {
            // For minutes, find the closest available option (X typically uses 5-min intervals: 00, 05, 10, ..., 55)
            const options = Array.from(minuteSelect.options);
            let closestOpt = options[0];
            let minDiff = Infinity;
            for (const opt of options) {
                const optVal = parseInt(opt.value);
                if (!isNaN(optVal)) {
                    const diff = Math.abs(optVal - minute);
                    if (diff < minDiff) {
                        minDiff = diff;
                        closestOpt = opt;
                    }
                }
            }
            await setSelectValue(minuteSelect, closestOpt.value, closestOpt.text.trim());
            console.log('[AutoPoster] Set minute:', closestOpt.value, '(target was', minute, ')');
            await wait(700);
        }

        // AM/PM MUST be set LAST — setting it before hour causes X's React to reset it
        if (ampmSelect) {
            await setSelectValue(ampmSelect, ampm, ampm);
            console.log('[AutoPoster] Set AM/PM:', ampm);
            await wait(700);
        }

        // Verification: log actual values after setting all fields
        await wait(500);
        const verifyDialog = document.querySelector('[role="dialog"]');
        if (verifyDialog) {
            const verifySelects = verifyDialog.querySelectorAll('select');
            const actualValues = Array.from(verifySelects).map(s => ({
                value: s.value,
                selectedText: s.options[s.selectedIndex]?.text?.trim() || 'N/A'
            }));
            console.log('[AutoPoster] VERIFY - Actual select values after setting:', JSON.stringify(actualValues));
            log(`7️⃣ Verify: ${actualValues.map(v => v.selectedText).join(' | ')}`);

            // Extra: re-verify AM/PM specifically since it's the most fragile
            if (ampmSelect) {
                const actualAmPm = ampmSelect.value || ampmSelect.options[ampmSelect.selectedIndex]?.text?.trim();
                if (actualAmPm !== ampm) {
                    console.warn('[AutoPoster] ⚠️ AM/PM drifted! Expected:', ampm, 'Got:', actualAmPm, '— re-setting...');
                    await setSelectValue(ampmSelect, ampm, ampm);
                    await wait(500);
                    console.log('[AutoPoster] AM/PM re-set to:', ampmSelect.value);
                }
            }

            // Extra: re-verify hour since changing AM/PM might have reset it
            if (hourSelect) {
                const actualHour = parseInt(hourSelect.value);
                if (actualHour !== hour12) {
                    console.warn('[AutoPoster] ⚠️ Hour drifted after AM/PM set! Expected:', hour12, 'Got:', actualHour, '— re-setting...');
                    await setSelectValue(hourSelect, hour12.toString(), hour12.toString());
                    await wait(500);
                    console.log('[AutoPoster] Hour re-set to:', hourSelect.value);
                }
            }
        }
    }

    async function setSelectValue(select, value, textMatch) {
        const valStr = value.toString();
        const valInt = parseInt(valStr);

        // Try multiple matching strategies
        const option = Array.from(select.options).find(o => {
            // Exact string match (value or text)
            if (o.value === valStr || o.text.trim() === valStr) return true;
            // Text match if provided (for month names, AM/PM)
            if (textMatch && (o.text.trim() === textMatch || o.value === textMatch)) return true;
            // Integer match (handles "1" matching "01" and vice versa)
            if (!isNaN(valInt) && parseInt(o.value) === valInt) return true;
            return false;
        });

        if (option) {
            console.log('[AutoPoster] Setting select: target=', value, 'found option value=', option.value, 'text=', option.text.trim(), 'index=', option.index);

            // Method 1: Native value setter (for React-controlled selects)
            try {
                const nativeSelectValueSetter = Object.getOwnPropertyDescriptor(
                    HTMLSelectElement.prototype, 'value'
                ).set;
                select.focus();
                nativeSelectValueSetter.call(select, option.value);
            } catch (e) {
                console.warn('[AutoPoster] Native setter failed:', e);
                select.value = option.value;
            }

            // Method 2: Also set selectedIndex directly
            try {
                const nativeIndexSetter = Object.getOwnPropertyDescriptor(
                    HTMLSelectElement.prototype, 'selectedIndex'
                ).set;
                nativeIndexSetter.call(select, option.index);
            } catch (e) {
                select.selectedIndex = option.index;
            }

            // Fire all relevant events to trigger React/Twitter state updates
            select.dispatchEvent(new Event('input', { bubbles: true }));
            select.dispatchEvent(new Event('change', { bubbles: true }));
            // Also try React 16+ SyntheticEvent triggers
            select.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
            select.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
            // MouseEvent to simulate user interaction
            select.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
            select.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
            select.dispatchEvent(new MouseEvent('click', { bubbles: true }));

            // Verify the value was set
            await wait(100);
            const actualValue = select.value;
            const actualText = select.options[select.selectedIndex]?.text?.trim();
            if (actualValue !== option.value) {
                console.warn('[AutoPoster] ⚠️ Value mismatch after set! Expected:', option.value, 'Got:', actualValue);
                // Force it again
                select.value = option.value;
                select.selectedIndex = option.index;
                select.dispatchEvent(new Event('change', { bubbles: true }));
            } else {
                console.log('[AutoPoster] ✅ Confirmed:', actualValue, '(', actualText, ')');
            }
        } else {
            console.warn('[AutoPoster] ⚠️ Option not found:', value, 'in', Array.from(select.options).map(o => `${o.value}="${o.text.trim()}"`));
        }
    }

    // --- Utility Functions ---

    function wait(ms) {
        return new Promise(r => setTimeout(r, ms));
    }

    function waitForElement(selector, timeout = 10000) {
        return new Promise((resolve, reject) => {
            const el = document.querySelector(selector);
            if (el) return resolve(el);

            const start = Date.now();
            const interval = setInterval(() => {
                const el = document.querySelector(selector);
                if (el) {
                    clearInterval(interval);
                    resolve(el);
                }
                if (Date.now() - start > timeout) {
                    clearInterval(interval);
                    reject(new Error(`Timed out waiting for: ${selector}`));
                }
            }, 300);
        });
    }

    function waitForUpload() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 180; // 3 minutes
            const interval = setInterval(() => {
                attempts++;

                const btn = document.querySelector('[data-testid="tweetButton"]');
                const progressBar = document.querySelector('[role="progressbar"]');

                // Check if the progress bar is done (at 100% or gone)
                let progressDone = !progressBar;
                if (progressBar) {
                    const ariaVal = progressBar.getAttribute('aria-valuenow');
                    const ariaMax = progressBar.getAttribute('aria-valuemax');
                    if (ariaVal && ariaMax && parseFloat(ariaVal) >= parseFloat(ariaMax)) {
                        progressDone = true;
                    }
                    // Also check if the progress bar text or width indicates 100%
                    const style = progressBar.style;
                    if (style && style.width === '100%') {
                        progressDone = true;
                    }
                }

                // Check if video preview/thumbnail is visible (video is ready)
                const videoPreview = document.querySelector('video[src]') ||
                    document.querySelector('[data-testid="videoPlayer"]') ||
                    document.querySelector('[aria-label="Embedded video"]');

                // Resolve if: button is enabled AND (progress is done OR video preview exists)
                if (btn && !btn.disabled && btn.getAttribute('aria-disabled') !== 'true' && (progressDone || videoPreview)) {
                    clearInterval(interval);
                    log('5️⃣ Upload complete!');
                    resolve();
                }

                // Also resolve if button is enabled and we've waited at least 10 seconds
                // (fallback for cases where progress bar detection fails)
                if (btn && !btn.disabled && btn.getAttribute('aria-disabled') !== 'true' && attempts >= 10) {
                    clearInterval(interval);
                    log('5️⃣ Upload complete! (button ready)');
                    resolve();
                }

                if (attempts >= maxAttempts) {
                    clearInterval(interval);
                    reject(new Error('Video upload timed out after 3 minutes'));
                }

                // Log progress every 10 seconds
                if (attempts % 10 === 0) {
                    const btnReady = btn && !btn.disabled && btn.getAttribute('aria-disabled') !== 'true';
                    log(`5️⃣ Uploading... (${attempts}s, btn=${btnReady ? 'ready' : 'waiting'}, progress=${progressDone ? 'done' : 'active'})`);
                }
            }, 1000);
        });
    }

    function waitForButtonEnabled(button, timeout = 10000) {
        return new Promise((resolve, reject) => {
            const start = Date.now();
            const interval = setInterval(() => {
                if (!button.disabled && button.getAttribute('aria-disabled') !== 'true') {
                    clearInterval(interval);
                    resolve();
                }
                if (Date.now() - start > timeout) {
                    clearInterval(interval);
                    reject(new Error('Button did not become enabled'));
                }
            }, 300);
        });
    }

    function waitForDialogClose(timeout = 15000) {
        return new Promise((resolve) => {
            const start = Date.now();
            const interval = setInterval(() => {
                // Check if the compose MODAL is still open
                // The modal has a close button and overlay that doesn't exist on the homepage
                const modalCloseBtn = document.querySelector('[data-testid="app-bar-close"]');
                const composeModal = document.querySelector('[aria-labelledby="modal-header"]');
                const composeOverlay = document.querySelector('[data-testid="mask"]');

                // If none of these modal indicators exist, the compose dialog is closed
                if (!modalCloseBtn && !composeModal && !composeOverlay) {
                    clearInterval(interval);
                    resolve();
                }

                if (Date.now() - start > timeout) {
                    clearInterval(interval);
                    console.warn('[AutoPoster] waitForDialogClose timed out');
                    resolve();
                }
            }, 500);
        });
    }

    async function tryCloseDialogs() {
        try {
            // First try pressing Escape to close any open dialogs
            document.dispatchEvent(new KeyboardEvent('keydown', {
                key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true
            }));
            await wait(500);

            // Then try clicking close buttons
            const closeSelectors = [
                '[data-testid="app-bar-close"]',
                '[aria-label="Close"]',
                '[data-testid="mask"]'
            ];

            for (const sel of closeSelectors) {
                const closeBtn = document.querySelector(sel);
                if (closeBtn) {
                    closeBtn.click();
                    console.log('[AutoPoster] Clicked close:', sel);
                    await wait(500);

                    // Handle the "Discard" confirmation that might appear
                    const discardBtn = document.querySelector('[data-testid="confirmationSheetConfirm"]');
                    if (discardBtn) {
                        discardBtn.click();
                        console.log('[AutoPoster] Clicked Discard');
                        await wait(500);
                    } else {
                        // Try text-based discard button
                        const allBtns = document.querySelectorAll('button, [role="button"]');
                        for (const btn of allBtns) {
                            if (btn.textContent.trim() === 'Discard') {
                                btn.click();
                                console.log('[AutoPoster] Clicked Discard (text)');
                                await wait(500);
                                break;
                            }
                        }
                    }
                    break; // Only need to close one dialog
                }
            }
        } catch (e) {
            console.log('[AutoPoster] Error closing dialogs:', e);
        }
    }

    function waitForScheduleDialog(timeout = 15000) {
        return new Promise((resolve, reject) => {
            const start = Date.now();
            const interval = setInterval(() => {
                // Look for the schedule date picker: it has select dropdowns for month, day, year, hour, minute
                const selects = document.querySelectorAll('select');
                let hasMonthSelect = false;
                for (const sel of selects) {
                    const opts = Array.from(sel.options).map(o => o.text);
                    if (opts.includes('January') || opts.includes('February') || opts.includes('March')) {
                        hasMonthSelect = true;
                        break;
                    }
                }

                // Also check for Confirm/Update button as indicator
                const confirmBtn = document.querySelector('[data-testid="scheduledConfirmationPrimaryAction"]');

                if (hasMonthSelect || selects.length >= 5 || confirmBtn) {
                    clearInterval(interval);
                    resolve();
                }

                if (Date.now() - start > timeout) {
                    clearInterval(interval);
                    // Don't reject — proceed anyway and let the Confirm step handle errors
                    console.warn('[AutoPoster] Schedule dialog wait timed out, proceeding anyway');
                    resolve();
                }
            }, 500);
        });
    }

    async function findAndClick(text) {
        const buttons = document.querySelectorAll('button, [role="button"]');
        for (const btn of buttons) {
            if (btn.textContent.trim().includes(text)) {
                btn.click();
                return true;
            }
        }
        return false;
    }

    async function clickConfirmButton() {
        const SKIP_TEST_IDS = ['tweetButton', 'tweetButtonInline'];

        function shouldSkip(el) {
            const tid = el.getAttribute('data-testid');
            return SKIP_TEST_IDS.includes(tid);
        }

        function matchesConfirm(text) {
            const t = text.trim().toLowerCase();
            return t === 'confirm' || t === 'update';
        }

        // Log all visible buttons AND other clickable elements for debugging
        const allClickable = document.querySelectorAll('button, [role="button"], [role="link"], div[tabindex], a[tabindex]');
        const clickableInfo = Array.from(allClickable).map(b => ({
            tag: b.tagName,
            text: b.textContent.trim().substring(0, 40),
            testId: b.getAttribute('data-testid') || '',
            ariaLabel: b.getAttribute('aria-label') || '',
            role: b.getAttribute('role') || '',
            disabled: b.disabled || false
        }));
        console.log('[AutoPoster] All clickable elements:', JSON.stringify(clickableInfo));

        // Also log all spans with short text (Confirm may be in a span)
        const allSpans = document.querySelectorAll('span');
        const confirmSpans = Array.from(allSpans).filter(s => {
            const t = s.textContent.trim().toLowerCase();
            return t === 'confirm' || t === 'update';
        });
        console.log('[AutoPoster] Confirm/Update spans found:', confirmSpans.length,
            confirmSpans.map(s => ({ text: s.textContent.trim(), parent: s.parentElement?.tagName, parentRole: s.parentElement?.getAttribute('role') })));

        // Strategy 1: data-testid (Twitter's schedule confirm button)
        const testIdBtn = document.querySelector('[data-testid="scheduledConfirmationPrimaryAction"]');
        if (testIdBtn) {
            testIdBtn.click();
            console.log('[AutoPoster] Clicked via data-testid scheduledConfirmationPrimaryAction');
            return true;
        }

        // Strategy 2: aria-label matching
        const ariaBtn = document.querySelector('[aria-label="Confirm"]') ||
            document.querySelector('[aria-label="Update"]');
        if (ariaBtn && !shouldSkip(ariaBtn)) {
            ariaBtn.click();
            console.log('[AutoPoster] Clicked via aria-label:', ariaBtn.getAttribute('aria-label'));
            return true;
        }

        // Strategy 3: Find spans with exact "Confirm"/"Update" text and click their clickable ancestor
        // This is the most reliable for X's header buttons (the Confirm button is often a div wrapping a span)
        for (const span of confirmSpans) {
            // Walk up the DOM tree to find a clickable parent
            let el = span;
            for (let depth = 0; depth < 8; depth++) {
                el = el.parentElement;
                if (!el) break;

                const isClickable = el.tagName === 'BUTTON' || el.tagName === 'A' ||
                    el.getAttribute('role') === 'button' ||
                    el.getAttribute('tabindex') !== null ||
                    el.style.cursor === 'pointer' ||
                    el.getAttribute('data-testid');

                if (isClickable && !shouldSkip(el)) {
                    el.click();
                    console.log('[AutoPoster] Clicked span ancestor:', el.tagName, 'text:', el.textContent.trim().substring(0, 30));
                    return true;
                }
            }

            // If no clickable parent found, try clicking the span's direct parent
            const parent = span.parentElement;
            if (parent && !shouldSkip(parent)) {
                parent.click();
                console.log('[AutoPoster] Clicked span direct parent:', parent.tagName);
                return true;
            }

            // Last resort: click the span itself
            span.click();
            console.log('[AutoPoster] Clicked span directly:', span.textContent.trim());
            return true;
        }

        // Strategy 4: Search inside all dialogs / layers for button elements
        const containers = document.querySelectorAll('[role="dialog"], [aria-modal="true"], [data-testid="sheetDialog"], [id="layers"]');
        for (const container of containers) {
            const btns = container.querySelectorAll('button, [role="button"], [role="menuitem"], div[tabindex="0"], div[tabindex="-1"]');
            for (const btn of btns) {
                if (shouldSkip(btn)) continue;
                if (matchesConfirm(btn.textContent)) {
                    btn.click();
                    console.log('[AutoPoster] Clicked in container:', btn.textContent.trim());
                    return true;
                }
            }
        }

        // Strategy 5: Global fallback — search all buttons on the page
        const debugBtns = document.querySelectorAll('button, [role="button"]');
        for (const btn of debugBtns) {
            if (shouldSkip(btn)) continue;
            if (matchesConfirm(btn.textContent)) {
                btn.click();
                console.log('[AutoPoster] Clicked global fallback:', btn.textContent.trim());
                return true;
            }
        }

        // Strategy 6: Partial text match inside dialog only
        for (const btn of debugBtns) {
            if (shouldSkip(btn)) continue;
            const t = btn.textContent.trim().toLowerCase();
            if (t.includes('confirm') || t.includes('update')) {
                const inDialog = btn.closest('[role="dialog"], [aria-modal="true"], [id="layers"]');
                if (inDialog) {
                    btn.click();
                    console.log('[AutoPoster] Clicked partial match:', btn.textContent.trim());
                    return true;
                }
            }
        }

        // Strategy 7: Last resort — findAndClick
        for (const label of ['Confirm', 'Update']) {
            const found = await findAndClick(label);
            if (found) return true;
        }

        console.error('[AutoPoster] Could not find Confirm/Update button! Clickable elements:', JSON.stringify(clickableInfo));
        return false;
    }

    function findButtonByAriaLabel(label) {
        return document.querySelector(`[aria-label="${label}"]`) ||
            document.querySelector(`button[aria-label*="${label}"]`);
    }

    // (duplicate tryCloseDialogs removed — using the one defined at line 523)

})();
