
import Link from "next/link";
import { AlertCircle, ChevronLeft } from "lucide-react";

export default function AuthCodeError() {
    return (
        <div className="min-h-screen bg-[#F0F0F0] flex flex-col items-center justify-center p-4 font-mono">
            <div className="max-w-md w-full border-4 border-black bg-white p-12 shadow-brutalist-large animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-4 mb-8">
                    <div className="bg-red-500 border-2 border-black p-2">
                        <AlertCircle className="size-6 text-white" />
                    </div>
                    <h1 className="text-2xl font-black uppercase tracking-tighter">Auth Failure</h1>
                </div>

                <p className="text-xs font-bold uppercase tracking-widest text-black/60 mb-8 leading-relaxed">
                    The GitHub authentication handshake failed. This typically occurs when a code has expired or the security node rejected the connection.
                </p>

                <div className="space-y-4">
                    <Link
                        href="/login"
                        className="btn-solid w-full flex items-center justify-center gap-2 py-4"
                    >
                        <ChevronLeft className="size-4" />
                        RETRY CONNECTION
                    </Link>

                    <Link
                        href="/"
                        className="w-full flex items-center justify-center gap-2 py-4 text-[10px] font-black uppercase tracking-[0.3em] text-black/40 hover:text-black transition-colors"
                    >
                        RETURN TO ORIGIN
                    </Link>
                </div>

                <div className="mt-12 pt-8 border-t-2 border-dashed border-black/10">
                    <p className="text-[10px] font-bold text-black/20 uppercase tracking-[0.2em]">
                        Error Code: 0xAUTH_EXCHANGE_FAIL
                    </p>
                </div>
            </div>
        </div>
    )
}
