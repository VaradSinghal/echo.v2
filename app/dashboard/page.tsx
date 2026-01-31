"use client"

import * as React from "react"
import { Search } from "lucide-react"

interface Repo {
    id: number
    name: string
    full_name: string
    html_url: string
    description: string | null
    stargazers_count: number
    language: string | null
    updated_at: string
}

export default function DashboardPage() {
    const [repos, setRepos] = React.useState<Repo[]>([])
    const [loading, setLoading] = React.useState(true)
    const [search, setSearch] = React.useState("")

    React.useEffect(() => {
        async function fetchRepos() {
            try {
                const res = await fetch('/api/github/repos')
                if (res.ok) {
                    const data = await res.json()
                    setRepos(data)
                }
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchRepos()
    }, [])

    const filteredRepos = repos.filter(repo =>
        repo.name.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Your Repositories</h2>
                <div className="relative w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                        placeholder="Search repositories..."
                        className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-4 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="text-center text-muted-foreground">Loading repositories...</div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredRepos.map((repo) => (
                        <div key={repo.id} className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 hover:shadow-md transition-shadow">
                            <div className="flex flex-col space-y-1.5">
                                <h3 className="font-semibold leading-none tracking-tight">
                                    <a href={repo.html_url} target="_blank" rel="noreferrer" className="hover:underline">
                                        {repo.name}
                                    </a>
                                </h3>
                                <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                                    {repo.description || "No description"}
                                </p>
                            </div>
                            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <span className={`inline-block h-3 w-3 rounded-full ${repo.language === 'TypeScript' ? 'bg-blue-500' : repo.language === 'JavaScript' ? 'bg-yellow-400' : 'bg-gray-400'}`}></span>
                                    {repo.language || "Unknown"}
                                </div>
                                <div>
                                    ⭐ {repo.stargazers_count}
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredRepos.length === 0 && (
                        <div className="col-span-full text-center text-muted-foreground">
                            No repositories found.
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
