"use client"

import * as React from "react"
import { createClient } from "@/utils/supabase/client"
import { Loader2, FileCode, GitPullRequest, AlertTriangle, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"

interface CodeDiffPreviewProps {
    taskId: string
    prUrl?: string
}

interface GeneratedCode {
    id: string
    file_path: string
    old_code: string | null
    new_code: string
    explanation: string
}

export function CodeDiffPreview({ taskId, prUrl }: CodeDiffPreviewProps) {
    const [generatedCode, setGeneratedCode] = React.useState<GeneratedCode[]>([])
    const [loading, setLoading] = React.useState(true)
    const [selectedFile, setSelectedFile] = React.useState<string | null>(null)
    const supabase = createClient()

    React.useEffect(() => {
        const fetchGeneratedCode = async () => {
            const { data, error } = await supabase
                .from('generated_code')
                .select('*')
                .eq('task_id', taskId)

            if (data && !error) {
                setGeneratedCode(data)
                if (data.length > 0) {
                    setSelectedFile(data[0].file_path)
                }
            }
            setLoading(false)
        }

        fetchGeneratedCode()
    }, [taskId, supabase])

    if (loading) {
        return (
            <div className="border-2 border-black p-8 bg-white text-center">
                <Loader2 className="size-6 animate-spin mx-auto mb-2" />
                <p className="text-[10px] font-black uppercase tracking-widest text-black/40">Loading generated code...</p>
            </div>
        )
    }

    if (generatedCode.length === 0) {
        return (
            <div className="border-2 border-black p-8 bg-white text-center">
                <AlertTriangle className="size-6 mx-auto mb-2 text-yellow-500" />
                <p className="text-[10px] font-black uppercase tracking-widest text-black/40">No generated code found</p>
            </div>
        )
    }

    const currentFile = generatedCode.find(gc => gc.file_path === selectedFile)

    return (
        <div className="border-2 border-black bg-white shadow-brutalist">
            {/* Header */}
            <div className="border-b-2 border-black bg-green-400 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <GitPullRequest className="size-5" />
                    <span className="text-xs font-black uppercase tracking-widest">Generated Code</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-black/60 uppercase">
                        {generatedCode.length} file(s) modified
                    </span>
                    {prUrl && (
                        <a
                            href={prUrl}
                            target="_blank"
                            className="flex items-center gap-1 px-3 py-1 bg-black text-white text-[10px] font-black uppercase hover:bg-neutral-800 transition-colors"
                        >
                            View PR <ExternalLink className="size-3" />
                        </a>
                    )}
                </div>
            </div>

            {/* File Tabs */}
            <div className="border-b-2 border-black bg-neutral-50 flex overflow-x-auto">
                {generatedCode.map(gc => (
                    <button
                        key={gc.file_path}
                        onClick={() => setSelectedFile(gc.file_path)}
                        className={cn(
                            "px-4 py-3 text-[10px] font-black uppercase tracking-wider border-r-2 border-black transition-all flex items-center gap-2",
                            selectedFile === gc.file_path
                                ? "bg-black text-white"
                                : "hover:bg-neutral-100"
                        )}
                    >
                        <FileCode className="size-3" />
                        {gc.file_path.split('/').pop()}
                    </button>
                ))}
            </div>

            {/* Code Content */}
            {currentFile && (
                <div className="p-0">
                    {/* Explanation */}
                    <div className="px-6 py-4 bg-blue-50 border-b-2 border-black">
                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1">Agent Explanation</p>
                        <p className="text-xs font-medium text-black/70">{currentFile.explanation}</p>
                    </div>

                    {/* Code Preview */}
                    <div className="max-h-[400px] overflow-auto">
                        <pre className="text-[11px] font-mono p-4 bg-neutral-900 text-green-400 whitespace-pre-wrap break-words">
                            {currentFile.new_code}
                        </pre>
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="border-t-2 border-black bg-neutral-50 px-6 py-3">
                <p className="text-[9px] font-bold uppercase tracking-wider text-black/40 text-center">
                    PR created automatically • Merge manually on GitHub when ready
                </p>
            </div>
        </div>
    )
}
