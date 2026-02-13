import { Star, Download } from "lucide-react";

interface AgentCardProps {
    name: string;
    description: string;
    author: string;
    rating: number;
    downloads: string;
    category: string;
    color?: string; // Hex color for the icon container
}

export function AgentCard({
    name,
    description,
    author,
    rating,
    downloads,
    category,
    color = "#000000"
}: AgentCardProps) {
    return (
        <div className="group border-2 border-black bg-white p-6 shadow-brutalist hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#000] transition-all duration-300 flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
                <div
                    className="h-12 w-12 border-2 border-black flex items-center justify-center text-white font-black text-xl uppercase"
                    style={{ backgroundColor: color }}
                >
                    {name.charAt(0)}
                </div>
                <div className="px-2 py-1 border border-black text-[10px] font-bold uppercase tracking-wider bg-neutral-100">
                    {category}
                </div>
            </div>

            <div className="flex-1 mb-6">
                <h3 className="text-lg font-black uppercase tracking-tight mb-1 group-hover:underline decoration-2 underline-offset-2">{name}</h3>
                <p className="text-xs font-bold text-black/40 mb-3">by {author}</p>
                <p className="text-sm font-medium leading-relaxed line-clamp-3">{description}</p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t-2 border-black/5">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-black" />
                        <span className="text-xs font-bold">{rating}</span>
                    </div>
                    <div className="flex items-center gap-1 text-black/40">
                        <Download className="h-3 w-3" />
                        <span className="text-xs font-bold">{downloads}</span>
                    </div>
                </div>
                <button className="text-xs font-black uppercase tracking-widest hover:bg-black hover:text-white px-3 py-1 transition-colors">
                    Install
                </button>
            </div>
        </div>
    );
}
