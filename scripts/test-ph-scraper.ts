
import { scrapeProductHuntComments } from '../lib/scraper/producthunt';

async function test() {
    const url = "https://www.producthunt.com/products/rewind-2";
    console.log(`Testing scraper for: ${url}`);

    try {
        const comments = await scrapeProductHuntComments(url);
        console.log("Scrape Result:");
        console.log(JSON.stringify(comments, null, 2));
    } catch (error) {
        console.error("Scrape failed:", error);
    }
}

test();
