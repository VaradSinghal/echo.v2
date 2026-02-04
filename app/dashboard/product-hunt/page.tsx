import { ProductHuntScraperView } from "@/components/product-hunt/scraper-view";

export default function ProductHuntPage() {
    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter">Product Hunt Scraper</h1>
                    <p className="text-black/60 font-medium mt-2">Ingest discussions and link to repositories</p>
                </div>
            </div>

            <ProductHuntScraperView />
        </div>
    );
}
