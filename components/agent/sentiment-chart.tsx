"use client"

import * as React from "react"
import { createClient } from "@/utils/supabase/client"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

export function SentimentChart() {
    const [data, setData] = React.useState<any[]>([])
    const supabase = createClient()

    React.useEffect(() => {
        const fetchData = async () => {
            const { data: analysis } = await supabase
                .from('feedback_analysis')
                .select('sentiment_score, category, analyzed_at')
                .order('analyzed_at', { ascending: true })
                .limit(50)

            if (analysis) {
                // Group by category or just show trend
                // For simplicity, let's show sentiment score trend
                const formatted = analysis.map((item, index) => ({
                    id: index,
                    sentiment: item.sentiment_score,
                    category: item.category,
                    date: new Date(item.analyzed_at).toLocaleDateString()
                }))
                setData(formatted)
            }
        }
        fetchData()
    }, [])

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
