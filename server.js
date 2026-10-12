require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Paste your copied Apify token here:
const APIFY_TOKEN = process.env.APIFY_TOKEN || "YOUR_APIFY_TOKEN_HERE";

app.post('/api/search', async (req, res) => {
    const { query } = req.body;

    if (!query) {
        return res.status(400).json({ success: false, error: 'Query is required.' });
    }

    try {
        console.log(`Starting live TikTok scrape for: "${query}"... (this takes 10-15s)`);

        // We run Apify's TikTok Scraper Lite actor synchronously
        const apifyUrl = `https://api.apify.com/v2/acts/clockworks~free-tiktok-scraper/run-sync-get-dataset-items?token=${APIFY_TOKEN}`;

        const response = await fetch(apifyUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                searchQueries: [query],
                resultsPerPage: 5
            })
        });

        if (!response.ok) {
            throw new Error(`Apify failed with status ${response.status}`);
        }

        const items = await response.json();

        if (!items || items.length === 0) {
            return res.json({
                success: true,
                data: [],
                summary: `No live TikTok posts found matching "${query}".`
            });
        }

        // Clean and format the returned TikTok data
        const posts = items.slice(0, 6).map(item => ({
            title: item.text || item.desc || 'Untitled TikTok Video',
            score: Number(item.diggCount || item.likes || item.playCount || 0), // Likes or Views
            comments: Number(item.commentCount || 0),
            author: item.authorMeta?.name || item.author || 'TikTok Creator',
            url: item.webVideoUrl || `https://www.tiktok.com/@${item.authorMeta?.name || 'video'}/video/${item.id}`
        }));

        const totalLikes = posts.reduce((sum, p) => sum + p.score, 0);

        res.json({
            success: true,
            data: posts,
            summary: `Retrieved ${posts.length} live TikTok videos regarding "${query}". Total engagement reaches ${totalLikes.toLocaleString()} interactions. Leading video by @${posts[0].author}.`
        });

    } catch (err) {
        console.error('Error fetching from Apify:', err);
        res.status(500).json({ success: false, error: 'Failed to scrape TikTok data.' });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});