import { LandingHero } from "@/components/landing/landing-hero"
import { FeaturesGrid } from "@/components/landing/features-grid"
import { LandingNav } from "@/components/landing/landing-nav"
import { LandingFooter } from "@/components/landing/landing-footer"
import { LiveFeed } from "@/components/landing/live-feed"

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen bg-white">
      <LandingNav />
      <LandingHero />
      <div id="features">
        <FeaturesGrid />
      </div>
      <div id="feed">
        <LiveFeed />
      </div>
      <LandingFooter />

      {/* Brutalist floating feedback button */}
      <div className="fixed bottom-8 right-8 z-50">
        <button className="bg-black text-white p-4 border border-white hover:bg-neutral-800 transition-all flex items-center gap-3 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]">
          <span className="font-black text-xs uppercase tracking-widest">Feedback</span>
        </button>
      </div>
    </main>
  )
}
