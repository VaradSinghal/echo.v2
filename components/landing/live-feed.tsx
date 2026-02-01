import React from "react"
import { ArrowRight } from "lucide-react"

export function LiveFeed() {
    const echoes = [
        {
            user: "@alex_dev",
            time: "2M AGO",
            repo: "HYPERFORM UI",
            feedback: '"The validation logic for the email field seems a bit redundant. It could be simplified using a single regex pattern."',
            pr_num: "#42",
            status: "READY",
            diff: [
                { type: "del", text: "- if (email.includes('@') && email.endsWith('.com')) {" },
                { type: "del", text: "-   return true;" },
                { type: "del", text: "- }" },
                { type: "add", text: "+ const emailRegex = /^[^\s@]+@[^\s@]+\\.[^\s@]+$/;" },
                { type: "add", text: "+ return emailRegex.test(email);" }
            ]
        },
        {
            user: "@sarah_codes",
            time: "15M AGO",
            repo: "TASKFLOW ENGINE",
            feedback: '"You should use `Promise.all` instead of sequential awaits for fetching the user profiles."',
            pr_num: "#108",
            status: "REVIEW",
            diff: [
                { type: "del", text: "- const user = await fetchUser();" },
                { type: "del", text: "- const stats = await fetchStats();" },
                { type: "add", text: "+ const [user, stats] = await Promise.all([" },
                { type: "add", text: "+   fetchUser()," },
                { type: "add", text: "+   fetchStats()" },
                { type: "add", text: "+ ]);" }
            ]
        }
    ]

    return (
        <section className="py-32 bg-white" id="feed">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-6">
                    <div>
                        <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase text-black">Live Echoes</h2>
                        <p className="text-neutral-500 mt-4 text-xl">Real-time feedback turning into code.</p>
                    </div>
                    <button className="flex items-center gap-2 font-black uppercase tracking-widest text-sm border-b-2 border-black pb-1 hover:text-neutral-600 hover:border-neutral-600 transition-colors text-black">
                        View Full Feed <ArrowRight className="w-4 h-4" />
                    </button>
                </div>

                <div className="grid md:grid-cols-2 gap-12">
                    {echoes.map((echo, idx) => (
                        <div key={idx} className="border border-black p-8 bg-white shadow-brutalist-large">
                            <div className="flex items-start gap-4 mb-8">
                                <div className="w-14 h-14 bg-neutral-200 border border-black flex-shrink-0" />
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-black uppercase tracking-tight text-lg text-black">{echo.user}</h4>
                                        <span className="text-xs font-bold text-neutral-400">{echo.time}</span>
                                    </div>
                                    <p className="text-sm font-bold text-neutral-400 mb-2 uppercase">REPLIED TO <span className="text-black">{echo.repo}</span></p>
                                    <p className="text-lg font-medium italic text-black">{echo.feedback}</p>
                                </div>
                            </div>

                            <div className="terminal-window bg-white">
                                <div className="border-b border-black px-4 py-2 flex items-center justify-between bg-neutral-100">
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 rounded-full border border-black"></div>
                                        <div className="w-3 h-3 rounded-full border border-black"></div>
                                        <div className="w-3 h-3 rounded-full border border-black"></div>
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-tighter text-black">PR {echo.pr_num} — {echo.status}</span>
                                </div>
                                <div className="p-6">
                                    <pre className="text-sm font-mono text-black leading-relaxed overflow-x-auto">
                                        <code>
                                            {echo.diff.map((line, i) => (
                                                <div key={i} className={line.type === 'add' ? 'font-bold' : 'text-neutral-400'}>
                                                    {line.text}
                                                </div>
                                            ))}
                                        </code>
                                    </pre>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
