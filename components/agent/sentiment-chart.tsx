"use client"

import * as React from "react"
import { createClient } from "@/utils/supabase/client"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

export function SentimentChart({ selectedRepo }: { selectedRepo: string }) {
    const [data, setData] = React.useState<any[]>([])
    const supabase = createClient()

    React.useEffect(() => {
        const fetchData = async () => {
            let query = supabase
                .from('feedback_analysis')
                .select(`
                    sentiment_score, 
                    category, 
                    analyzed_at,
                    comments!inner (
                        post_id,
                        posts!inner (repo_link)
                    )
                `)

            if (selectedRepo !== "all") {
                query = query.eq('comments.posts.repo_link', selectedRepo)
            }

            const { data: analysis } = await query
                .order('analyzed_at', { ascending: true })
                .limit(50)

            if (analysis) {
                const formatted = analysis.map((item: any, index: number) => ({
                    id: index,
                    sentiment: item.sentiment_score,
                    category: item.category,
                    date: new Date(item.analyzed_at).toLocaleDateString()
                }))
                setData(formatted)
            }
        }
        fetchData()
    }, [supabase, selectedRepo])

    return (
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm h-[300px] flex flex-col">
            <div className="p-6 pb-2">
                <h3 className="text-lg font-semibold">Sentiment Trend</h3>
            </div>
            <div className="flex-1 p-4 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <XAxis dataKey="id" hide />
                        <YAxis domain={[-1, 1]} />
                        <Tooltip
                            labelFormatter={() => ""}
                            formatter={(value: any) => [typeof value === 'number' ? value.toFixed(2) : value, "Score"]}
                        />
                        <Bar dataKey="sentiment" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
