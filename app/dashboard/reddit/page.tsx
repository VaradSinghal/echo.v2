
import { ScraperView } from "@/components/reddit/scraper-view";

export default function RedditPage() {
    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-4">
                <div className="inline-flex items-center gap-2 group">
                    <span className="h-2 w-2 bg-black animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-black">External Signal Source</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase text-black">Reddit Uplink</h1>
            </div>

            <ScraperView />
        </div>
    );
}
