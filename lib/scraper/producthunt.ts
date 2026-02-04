
import puppeteer from 'puppeteer';

export interface ProductHuntComment {
    id: string;
    author: string;
    content: string;
    upvotes: number;
    timestamp?: string;
}

export async function scrapeProductHuntComments(url: string): Promise<ProductHuntComment[]> {
    console.log(`Starting scrape for ${url}`);
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

        // Wait for potential comment section or just generic body load
        try {
            await page.waitForSelector('div[class*="comments"]', { timeout: 5000 });
        } catch (e) {
            console.log('Timeout waiting for comments selector, proceeding anyway...');
        }

        // Auto-scroll to trigger lazy loading
        try {
            await page.evaluate(async () => {
                await new Promise<void>((resolve) => {
                    let totalHeight = 0;
                    const distance = 100;
                    const timer = setInterval(() => {
                        const scrollHeight = document.body.scrollHeight;
                        window.scrollBy(0, distance);
                        totalHeight += distance;

                        // Stop scrolling after a bit or if reached bottom
                        if (totalHeight >= scrollHeight || totalHeight > 5000) {
                            clearInterval(timer);
                            resolve();
                        }
                    }, 100);
                });
            });
            // Wait a bit for network requests to settle after scroll
            await new Promise(r => setTimeout(r, 2000));
        } catch (e) {
            console.error("Scroll error:", e);
        }

        const title = await page.title();
        console.log(`Page Title: ${title}`);

        const comments = await page.evaluate(() => {
            const results: any[] = [];

            // Strategy: Try to find Next.js hydration data
            const nextDataScript = document.getElementById('__NEXT_DATA__');
            if (nextDataScript) {
                try {
                    const json = JSON.parse(nextDataScript.innerText);
                    // Traverse JSON to find comments. This is tricky as structure varies.
                    // We look for objects that have 'body' and 'user' fields.

                    const traverse = (obj: any) => {
                        if (!obj || typeof obj !== 'object') return;

                        // Check if this object looks like a comment
                        if (obj.body && obj.user && obj.user.name && obj.id) {
                            results.push({
                                id: obj.id,
                                author: obj.user.name,
                                content: obj.body,
                                upvotes: obj.votes_count || 0
                            });
                        }

                        // Check for 'comments' array
                        if (Array.isArray(obj.comments)) {
                            obj.comments.forEach((c: any) => traverse(c));
                        }

                        // Generic traversal
                        Object.values(obj).forEach(val => {
                            traverse(val);
                        });
                    };

                    // Start traversal from props
                    if (json.props) traverse(json.props);

                    // Strategy 2: Apollo State in NEXT_DATA (Common in PH)
                    // PH often uses Apollo GraphQL and dehydrates state into 'apolloState' or 'pageProps.apolloState'
                    const apolloState = json.props?.pageProps?.apolloState || json.props?.apolloState;
                    if (apolloState) {
                        // Iterate over all keys in Apollo cache
                        Object.values(apolloState).forEach((item: any) => {
                            // Look for Comment types
                            if (item.__typename === 'Comment' && item.body) {
                                // Need to find user. Usually a reference "user":{"__ref":"User:123"}
                                let authorName = 'ProductHuntUser';
                                if (item.user && item.user.__ref) {
                                    const userRef = apolloState[item.user.__ref];
                                    if (userRef && userRef.name) authorName = userRef.name;
                                } else if (item.user && item.user.name) {
                                    authorName = item.user.name;
                                }

                                results.push({
                                    id: item.id || Math.random().toString(36),
                                    author: authorName,
                                    content: item.body,
                                    upvotes: item.votes_count || 0
                                });
                            }
                        });
                    }

                } catch (e) {
                    console.error("Failed to parse NEXT_DATA", e);
                }
            }

            if (results.length > 0) return results;

            // Fallback: Look for text content in article logic (simplified)
            // ... (keep previous valid logic if needed, or just return empty to avoid noise)

            // Heuristic 1: Look for explicit comment containers by class fuzzy match
            // "comment" is usually in the class name even if obfuscated (e.g. styles_comment__...)
            const explicitComments = Array.from(document.querySelectorAll('div[class*="comment"]'));

            explicitComments.forEach(el => {
                const body = el.querySelector('[class*="body"], [class*="content"]');
                const author = el.querySelector('a[href^="/@"]');

                if (body && (body as HTMLElement).innerText.length > 2) {
                    results.push({
                        id: Math.random().toString(36).substr(2, 9),
                        author: author ? (author as HTMLElement).innerText : 'Unknown',
                        content: (body as HTMLElement).innerText,
                        upvotes: 0
                    });
                }
            });

            if (results.length > 0) return results;

            // Heuristic 2: Look for containers with "Reply" buttons
            // Comments usually have a "Reply" action.
            const buttons = Array.from(document.querySelectorAll('button, a'));
            const replyButtons = buttons.filter(b => (b as HTMLElement).innerText === 'Reply');

            replyButtons.forEach(btn => {
                // Traverse up to find a container that has text.
                // The comment text is usually a sibling or cousin of the action bar.
                let container = btn.parentElement;
                let foundText = '';
                let attempts = 0;

                while (container && attempts < 5) {
                    const text = (container as HTMLElement).innerText;
                    // If text is significantly longer than "Reply" and "Upvote", we likely found the comment block
                    if (text.length > 20 && text.length < 1000 && !text.includes('Product Hunt')) {
                        // Clean up the text (remove Reply, Upvote, etc)
                        foundText = text.replace(/Reply|Upvote|Share/g, '').trim();
                        break;
                    }
                    container = container.parentElement;
                    attempts++;
                }

                if (foundText) {
                    results.push({
                        id: Math.random().toString(36).substr(2, 9),
                        author: 'User', // Hard to get author without specific selector
                        content: foundText,
                        upvotes: 0
                    });
                }
            });

            if (results.length > 0) return results;

            // Heuristic 3 (User Verification): Look for specific 'richText' or 'prose' classes
            // User provided: class="prose styles-module__3C9wzW__richText prose..."
            const richTextElements = Array.from(document.querySelectorAll('[class*="richText"], [class*="prose"]'));

            richTextElements.forEach(el => {
                const text = (el as HTMLElement).innerText;
                if (text.length > 2 && text.length < 1500) {
                    // Finds the closest common ancestor for author? 
                    // Usually author is in a sibling or parent container.
                    // Let's traverse up 2-3 levels to find a container that has an 'a' tag with href including 'user' or '@'
                    let parent = el.parentElement;
                    let author = 'Unknown';
                    let foundAuthor = false;
                    let depth = 0;

                    while (parent && depth < 4 && !foundAuthor) {
                        const authorLink = parent.querySelector('a[href^="/@"]');
                        if (authorLink) {
                            author = (authorLink as HTMLElement).innerText;
                            foundAuthor = true;
                        }
                        parent = parent.parentElement;
                        depth++;
                    }

                    // If we found a plausible text block, add it.
                    // Filter out main product description which might also be .prose
                    // Comments usually have an author found nearby.
                    if (foundAuthor) {
                        results.push({
                            id: Math.random().toString(36).substr(2, 9),
                            author: author,
                            content: text,
                            upvotes: 0
                        });
                    }
                }
            });

            // De-duplicate results based on content
            const uniqueResults = results.filter((v, i, a) => a.findIndex(t => (t.content === v.content)) === i);
            return uniqueResults;
        });

        console.log(`Extracted ${comments.length} comments.`);
        return comments;

    } catch (error) {
        console.error('Error scraping Product Hunt:', error);
        return [];
    } finally {
        await browser.close();
    }
}
