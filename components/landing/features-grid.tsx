import React from "react"

export function FeaturesGrid() {
    return (
        <section className="py-32 bg-neutral-50 border-y border-black" id="features">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-24">
                    <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase text-black">How it Works</h2>
                    <div className="w-24 h-2 bg-black mt-4"></div>
                </div>

                <div className="grid md:grid-cols-3 gap-0 border border-black">
                    <div className="p-12 bg-white border-r border-black last:border-r-0">
                        <div className="text-black mb-8">
                            <span className="material-symbols-outlined text-5xl">upload_file</span>
                        </div>
                        <h3 className="text-2xl font-black uppercase mb-4 tracking-tight text-black">01. Post Product</h3>
                        <p className="text-neutral-600 leading-relaxed font-medium">
                            Share your GitHub repository. Echo automatically indexes your codebase to prepare for technical feedback.
                        </p>
                    </div>

                    <div className="p-12 bg-white border-r border-black last:border-r-0">
                        <div className="text-black mb-8">
                            <span className="material-symbols-outlined text-5xl">forum</span>
                        </div>
                        <h3 className="text-2xl font-black uppercase mb-4 tracking-tight text-black">02. Get Feedback</h3>
                        <p className="text-neutral-600 leading-relaxed font-medium">
                            Developers test your application and provide technical feedback directly on your Echo profile.
                        </p>
                    </div>

                    <div className="p-12 bg-white">
                        <div className="text-black mb-8">
                            <span className="material-symbols-outlined text-5xl">smart_toy</span>
                        </div>
                        <h3 className="text-2xl font-black uppercase mb-4 tracking-tight text-black">03. Auto PRs</h3>
                        <p className="text-neutral-600 leading-relaxed font-medium">
                            Our AI analyzes feedback, identifies improvements, and generates production-ready Pull Requests automatically.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    )
}
