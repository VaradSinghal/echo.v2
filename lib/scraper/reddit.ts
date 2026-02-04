
import puppeteer from 'puppeteer';

export interface RedditComment {
    id: string;
    author: string;
    content: string;
    upvotes: number;
    timestamp?: string;
}

export async function scrapeRedditComments(url: string): Promise<RedditComment[]> {
    console.log(`Starting scrape for ${url}`);
    const browser = await puppeteer.launch({
        headless: true, // Set to false for debugging
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();

        // Set a realistic User-Agent to avoid immediate blocking
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });



        // Wait for content to load
        try {
            await page.waitForSelector('shreddit-comment', { timeout: 5000 });
        } catch (e) {
            console.log('Timeout waiting for shreddit-comment, trying fallbacks...');
        }

        const title = await page.title();
        console.log(`Page Title: ${title}`);

        // Extract comments with multiple strategies
        const comments = await page.evaluate(() => {
            const results: any[] = [];

            // Strategy 1: <shreddit-comment> (New Reddit)
            const shredditComments = document.querySelectorAll('shreddit-comment');
            if (shredditComments.length > 0) {
                shredditComments.forEach((el) => {
                    const author = el.getAttribute('author') || '[deleted]';
                    const id = el.getAttribute('thingid') || '';
                    const score = parseInt(el.getAttribute('score') || '0', 10);
                    const bodySlot = el.querySelector('[slot="comment"]');
                    const content = bodySlot ? (bodySlot as HTMLElement).innerText : (el as HTMLElement).innerText;

                    if (content && content.trim()) {
                        results.push({ id, author, content: content.trim(), upvotes: score });
                    }
                });
                return results;
            }

            // Strategy 2: Old Reddit / classic divs
            const userContentDivs = document.querySelectorAll('div.usertext-body'); // classic old.reddit
            if (userContentDivs.length > 0) {
                userContentDivs.forEach((el) => {
                    const content = (el as HTMLElement).innerText;
                    if (content && content.trim()) {
                        results.push({ id: 'unknown', author: 'unknown', content: content.trim(), upvotes: 0 });
                    }
                });
                return results;
            }

            // Strategy 3: Generic text search (Last resort, unreliable but good for debug)
            // Just grabbing paragraph text from likely containers
            const likelyText = Array.from(document.querySelectorAll('div[data-testid="comment"] p')).map(p => ({
                id: 'generated',
                author: 'unknown',
                content: (p as HTMLElement).innerText,
                upvotes: 0
            }));

            return likelyText.length > 0 ? likelyText : results;
        });

        console.log(`Extracted ${comments.length} comments.`);
        return comments;

    } catch (error) {
        console.error('Error scraping Reddit:', error);
        return [];
    } finally {
        await browser.close();
    }
}
