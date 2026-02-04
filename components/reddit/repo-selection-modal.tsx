"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, Github, Check } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Repo {
    id: number;
    name: string;
    full_name: string;
    html_url: string;
    description: string;
    updated_at: string;
}

interface RepoSelectionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (repoUrl: string) => void;
}

export function RepoSelectionModal({ open, onOpenChange, onSelect }: RepoSelectionModalProps) {
    const [repos, setRepos] = useState<Repo[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        if (open && repos.length === 0) {
            fetchRepos();
        }
    }, [open]);

    const fetchRepos = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/github/repos");
            if (!res.ok) {
                if (res.status === 404) throw new Error("No GitHub token found. Please connect GitHub.");
                throw new Error("Failed to fetch repositories.");
            }
            const data = await res.json();
            setRepos(Array.isArray(data) ? data : []);
        } catch (err: any) {
            setError(err.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const filteredRepos = repos.filter(repo =>
        repo.full_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-white border-2 border-black shadow-brutalist p-0 gap-0 overflow-hidden">
                <DialogHeader className="p-6 border-b-2 border-black bg-neutral-50">
                    <DialogTitle className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
                        <Github className="h-5 w-5" />
                        Link Repository
                    </DialogTitle>
                </DialogHeader>

                <div className="p-6 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black/40" />
                        <Input
                            placeholder="Search repositories..."
                            value={searchQuery}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                            className="pl-9 border-2 border-black rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-white font-bold placeholder:text-black/30 text-sm"
                        />
                    </div>

                    <div className="border-2 border-black min-h-[300px] relative bg-neutral-50">
                        {loading ? (
                            <div className="absolute inset-0 flex items-center justify-center flex-col gap-2 text-black/50">
                                <Loader2 className="h-6 w-6 animate-spin" />
                                <span className="text-xs font-bold uppercase tracking-widest">Fetching Repos...</span>
                            </div>
                        ) : error ? (
                            <div className="absolute inset-0 flex items-center justify-center p-4 text-center">
                                <p className="text-sm font-bold text-red-600">{error}</p>
                            </div>
                        ) : filteredRepos.length === 0 ? (
                            <div className="absolute inset-0 flex items-center justify-center text-black/40">
                                <p className="text-sm font-bold uppercase tracking-widest">No repositories found</p>
                            </div>
                        ) : (
                            <ScrollArea className="h-[300px]">
                                <div className="divide-y-2 divide-black/5">
                                    {filteredRepos.map((repo) => (
                                        <button
                                            key={repo.id}
                                            onClick={() => onSelect(repo.html_url)}
                                            className="w-full text-left p-4 hover:bg-black hover:text-white transition-all group flex items-start gap-3"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-bold truncate">{repo.full_name}</h4>
                                                {repo.description && (
                                                    <p className="text-xs opacity-60 truncate mt-0.5 group-hover:opacity-80">
                                                        {repo.description}
                                                    </p>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </ScrollArea>
                        )}
                    </div>
                </div>

                <DialogFooter className="p-4 border-t-2 border-black bg-neutral-50 flex justify-between gap-2">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="flex-1 font-bold uppercase tracking-wider hover:bg-black/5"
                    >
                        Cancel
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
