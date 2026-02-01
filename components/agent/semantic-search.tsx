"use client"

import * as React from "react"
import { Search, Loader2, Link2, Download } from "lucide-react"
import { semanticSearch } from "@/app/actions/agent"

export function SemanticSearch({ selectedRepo }: { selectedRepo: string }) {
    const [query, setQuery] = React.useState("")
    const [results, setResults] = React.useState<any[]>([])
    const [loading, setLoading] = React.useState(false)

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!query.trim()) return

        setLoading(true)
        const { data, error } = await semanticSearch(query, selectedRepo)
        if (data) setResults(data)
        setLoading(false)
    }

    const exportToCsv = () => {
        const headers = ["Content", "Similarity"]
        const csvContent = [
            headers.join(","),
            ...results.map(r => `"${r.content.replace(/"/g, '""')}",${r.similarity.toFixed(4)}`)
        ].join("\n")

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement("a")
        const url = URL.createObjectURL(blob)
        link.setAttribute("href", url)
        link.setAttribute("download", `semantic-search-results.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <div className="space-y-6">
            <div className="rounded-lg border bg-card p-4 shadow-sm">
                <form onSubmit={handleSearch} className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Search feedback semantically... (e.g., 'users complaining about performance')"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    {loading && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                    )}
                </form>
            </div>

            {results.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold">Semantic Matches</h3>
                        <button
                            onClick={exportToCsv}
                            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
                        >
                            <Download className="h-3 w-3" /> Export CSV
                        </button>
                    </div>
                    <div className="grid gap-4">
                        {results.map((result, idx) => (
                            <div key={idx} className="rounded-lg border bg-card p-4 hover:border-primary/50 transition-colors">
                                <div className="flex items-start justify-between mb-2">
                                    <p className="text-sm line-clamp-3">{result.content}</p>
                                    <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-1 rounded">
                                        {(result.similarity * 100).toFixed(1)}% match
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    <Link2 className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">COMMENT LINK</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
