"use client";

import { useState } from "react";
import { scrapeRedditPostAction, saveRedditCommentsAction } from "@/app/actions/scraper";
import { RedditComment } from "@/lib/scraper/reddit";
import { Loader2, Save, Search, MessageSquare, ArrowUp } from "lucide-react";

export function ScraperView() {
    const [url, setUrl] = useState("");
    const [scrapedComments, setScrapedComments] = useState<RedditComment[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [resultMsg, setResultMsg] = useState("");

    const handleScrape = async () => {
        if (!url) return;
        setLoading(true);
        setResultMsg("");
        setScrapedComments([]);

        const res = await scrapeRedditPostAction(url);
        if (res.success && res.data) {
            setScrapedComments(res.data);
            if (res.data.length === 0) setResultMsg("No comments found (or blocked).");
        } else {
            setResultMsg(`Error: ${res.error}`);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        if (scrapedComments.length === 0) return;
        setSaving(true);
        setResultMsg("");

        const res = await saveRedditCommentsAction(url, scrapedComments);
        if (res.success) {
            setResultMsg("Success! Comments saved to database.");
            // clearer feedback or redirect?
        } else {
            setResultMsg(`Save Failed: ${res.error}`);
        }
        setSaving(false);
    };

    return (
        <div className="space-y-12">
            {/* Input Section */}
            <div className="border-2 border-black bg-white p-8 shadow-brutalist">
                <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-2 mb-2">
                        <Search className="h-5 w-5" />
                        <h2 className="text-sm font-black uppercase tracking-widest">Target Frequency</h2>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4">
                        <input
                            type="text"
                            placeholder="PASTE REDDIT THREAD URL..."
                            className="flex-1 border-2 border-black bg-neutral-50 p-4 text-sm font-bold placeholder:text-black/30 focus:outline-none focus:bg-white transition-colors"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                        />
                        <button
                            onClick={handleScrape}
                            disabled={loading}
                            className="flex items-center justify-center gap-2 bg-black text-white px-8 py-4 text-xs font-black uppercase tracking-widest hover:bg-neutral-800 disabled:opacity-50 transition-all border-2 border-black"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                            {loading ? "Scanning..." : "Scan Thread"}
                        </button>
                    </div>

                    {resultMsg && (
                        <div className="border-2 border-black p-4 bg-yellow-300 text-xs font-bold uppercase tracking-wide">
                            {resultMsg}
                        </div>
                    )}
                </div>
            </div>

            {/* Results Section */}
            {scrapedComments.length > 0 && (
                <div className="space-y-6">
                    <div className="flex justify-between items-end border-b-2 border-black pb-4">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-black/40 block mb-1">Status Report</span>
                            <h3 className="text-2xl font-black uppercase tracking-tighter">Detected {scrapedComments.length} Signals</h3>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 border-2 border-black bg-white px-6 py-3 text-xs font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all disabled:opacity-50 shadow-brutalist"
                        >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {saving ? "Archiving..." : "Archive All"}
                        </button>
                    </div>

                    <div className="grid gap-4">
                        {scrapedComments.map((comment, idx) => (
                            <div key={idx} className="border-2 border-black bg-white p-6 hover:shadow-brutalist transition-all duration-300">
                                <div className="flex justify-between items-start mb-4 border-b border-dashed border-black/10 pb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="bg-black text-white p-1">
                                            <MessageSquare className="h-3 w-3" />
                                        </div>
                                        <span className="text-xs font-black uppercase tracking-wider">u/{comment.author}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-black/60">
                                        <ArrowUp className="h-3 w-3" />
                                        <span className="text-xs font-bold">{comment.upvotes}</span>
                                    </div>
                                </div>
                                <p className="text-sm font-medium leading-relaxed">{comment.content}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
