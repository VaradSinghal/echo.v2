
import { scrapeRedditComments } from '@/lib/scraper/reddit';

// A relatively safe, public Reddit thread for testing
// "What is your favorite programming language?" on r/askprogramming
const TEST_URL = 'https://www.reddit.com/r/software/comments/1pk9bxv/ideas_for_building_software/';

async function runtest() {
    console.log('Running scraper test...');
    try {
        const comments = await scrapeRedditComments(TEST_URL);
        console.log('Scraping complete.');
        console.log(`Found ${comments.length} comments.`);

        if (comments.length > 0) {
            console.log('Sample comment:', comments[0]);
        } else {
            console.log('No comments found. Check if the selector is correct or if blocked.');
        }
    } catch (e) {
        console.error('Test failed:', e);
    }
}

runtest();
