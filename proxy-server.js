const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Proxy endpoint to fetch and analyze URLs
app.post('/analyze', async (req, res) => {
    const { url } = req.body;
    
    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    let browser;
    try {
        // Launch Puppeteer browser
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        
        // Set user agent to avoid bot detection
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        
        // Navigate to the URL
        await page.goto(url, { 
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        // Inject axe-core
        await page.addScriptTag({
            url: 'https://unpkg.com/axe-core@4.8.2/axe.min.js'
        });

        // Run axe accessibility scan
        const results = await page.evaluate(async () => {
            return await axe.run();
        });

        // Get page title and meta info
        const pageInfo = await page.evaluate(() => {
            return {
                title: document.title,
                url: window.location.href,
                description: document.querySelector('meta[name="description"]')?.content || '',
                viewport: document.querySelector('meta[name="viewport"]')?.content || ''
            };
        });

        res.json({
            success: true,
            pageInfo,
            results
        });

    } catch (error) {
        console.error('Error analyzing URL:', error);
        res.status(500).json({ 
            error: 'Failed to analyze URL',
            details: error.message 
        });
    } finally {
        if (browser) {
            await browser.close();
        }
    }
});

app.listen(PORT, () => {
    console.log(`Accessibility analyzer server running on http://localhost:${PORT}`);
});