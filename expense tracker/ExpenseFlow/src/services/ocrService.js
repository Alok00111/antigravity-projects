// File: src/services/ocrService.js
// Cloud-based OCR service using OCR.space free API
// Works in Expo Go — no native modules required

import * as FileSystem from 'expo-file-system';

// Free OCR.space API key (25,000 requests/month)
const OCR_API_KEY = 'K85087988188957';
const OCR_API_URL = 'https://api.ocr.space/parse/image';

/**
 * Send image to OCR.space cloud API and return raw text.
 */
const performCloudOcr = async (imageUri) => {
    // Read image as base64
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: 'base64',
    });

    // Determine MIME type from URI
    const ext = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
    const mime = ext === 'png' ? 'image/png' : 'image/jpeg';

    const formData = new FormData();
    formData.append('base64Image', `data:${mime};base64,${base64}`);
    formData.append('language', 'eng');
    formData.append('isOverlayRequired', 'false');
    formData.append('detectOrientation', 'true');
    formData.append('scale', 'true');
    formData.append('OCREngine', '2'); // Engine 2 is better for receipts

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000); // 20s timeout

    try {
        const response = await fetch(OCR_API_URL, {
            method: 'POST',
            headers: {
                apikey: OCR_API_KEY,
            },
            body: formData,
            signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!response.ok) {
            throw new Error(`API returned status ${response.status}`);
        }

        const data = await response.json();

        if (data.IsErroredOnProcessing) {
            throw new Error(data.ErrorMessage?.[0] || 'OCR processing failed');
        }

        const text = data.ParsedResults
            ?.map((r) => r.ParsedText)
            .join('\n')
            .trim();

        return text || '';
    } catch (error) {
        clearTimeout(timeout);
        if (error.name === 'AbortError') {
            throw new Error('OCR request timed out. Please check your internet connection.');
        }
        throw error;
    }
};

/**
 * Extract amount from text using common receipt patterns.
 * Looks for total/grand total/amount due patterns first, then largest currency amount.
 */
const extractAmount = (text) => {
    const lines = text.split('\n');

    // Priority patterns — look for "Total", "Grand Total", "Amount Due", etc.
    const totalPatterns = [
        /(?:grand\s*total|total\s*amount|amount\s*due|net\s*amount|total)\s*[:\-]?\s*[₹$€£]?\s*([\d,]+\.?\d*)/i,
        /[₹$€£]\s*([\d,]+\.?\d*)\s*(?:total|due)/i,
    ];

    for (const pattern of totalPatterns) {
        for (const line of lines) {
            const match = line.match(pattern);
            if (match) {
                const amount = parseFloat(match[1].replace(/,/g, ''));
                if (amount > 0 && amount < 10000000) return amount;
            }
        }
    }

    // Fallback: find all currency amounts and pick the largest
    const amountPattern = /[₹$€£]?\s*([\d,]+\.?\d{0,2})/g;
    let maxAmount = 0;
    for (const line of lines) {
        let match;
        while ((match = amountPattern.exec(line)) !== null) {
            const val = parseFloat(match[1].replace(/,/g, ''));
            if (val > maxAmount && val < 10000000) maxAmount = val;
        }
    }

    return maxAmount > 0 ? maxAmount : null;
};

/**
 * Extract date from receipt text.
 */
const extractDate = (text) => {
    const datePatterns = [
        // DD/MM/YYYY or DD-MM-YYYY
        /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,
        // YYYY-MM-DD
        /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,
        // DD Mon YYYY
        /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+(\d{4})/i,
    ];

    for (const pattern of datePatterns) {
        const match = text.match(pattern);
        if (match) {
            try {
                const dateStr = match[0];
                const parsed = new Date(dateStr);
                if (!isNaN(parsed.getTime())) return parsed.toISOString();
            } catch (e) { /* skip invalid dates */ }
        }
    }
    return null;
};

/**
 * Extract merchant/store name — typically the first non-empty line of a receipt.
 */
const extractMerchant = (text) => {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2);
    // First meaningful line is usually the store name
    if (lines.length > 0) {
        const merchant = lines[0].substring(0, 50); // Cap at 50 chars
        return merchant;
    }
    return null;
};

/**
 * Main OCR function: scans an image URI and returns parsed receipt data.
 * Returns { amount, date, note, rawText, isAvailable }
 */
const parseReceiptFromUri = async (imageUri) => {
    try {
        const fullText = await performCloudOcr(imageUri);

        if (!fullText) {
            return {
                amount: null,
                date: null,
                note: null,
                rawText: '',
                isAvailable: true,
                error: 'No text detected in the image. Try a clearer photo.',
            };
        }

        const amount = extractAmount(fullText);
        const date = extractDate(fullText);
        const note = extractMerchant(fullText);

        return {
            amount,
            date,
            note,
            rawText: fullText,
            isAvailable: true,
            error: null,
        };
    } catch (error) {
        console.error('OCR scan failed:', error);
        return {
            amount: null,
            date: null,
            note: null,
            rawText: null,
            isAvailable: true,
            error: error.message || 'Failed to scan receipt. Check your internet connection and try again.',
        };
    }
};

/**
 * Check if OCR is available — always true with cloud API.
 */
const isOcrAvailable = async () => {
    return true;
};

export default {
    parseReceiptFromUri,
    isOcrAvailable,
    extractAmount,
    extractDate,
    extractMerchant,
};
