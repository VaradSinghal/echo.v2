"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, LogOut, LayoutDashboard, Activity, Bot, User } from "lucide-react"
import { cn } from "@/utils/cn"

interface NavItem {
    href: string
    label: string
    icon: React.ReactNode
}

interface DashboardSidebarProps {
    session: any
    navItems: NavItem[]
    signOut: () => Promise<void>
}

export function DashboardSidebar({ session, navItems, signOut }: DashboardSidebarProps) {
    const [isOpen, setIsOpen] = React.useState(false)
    const pathname = usePathname()

    const toggleSidebar = () => setIsOpen(!isOpen)

    return (
        <>
            {/* Desktop Sidebar */}
            <div className="hidden border-r-2 border-black bg-white lg:block sticky top-0 h-screen overflow-y-auto w-[280px]">
                <div className="flex h-full max-h-screen flex-col">
                    <div className="flex h-20 items-center justify-center border-b-2 border-black px-6">
                        <Link className="flex items-center gap-2" href="/">
                            <img src="/logo.png" alt="Echo" className="h-8 w-8" />
                            <span className="text-2xl font-black uppercase tracking-tighter text-black">Echo</span>
                        </Link>
                    </div>

                    <div className="flex-1 overflow-auto py-8">
                        <nav className="grid items-start px-4 gap-2">
                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    className={cn(
                                        "flex items-center gap-4 border-2 border-transparent px-4 py-3 text-xs font-black uppercase tracking-widest transition-all hover:text-black hover:border-black active:shadow-brutalist",
                                        pathname === item.href ? "text-black border-black bg-black/5" : "text-black/40"
                                    )}
                                    href={item.href}
                                >
                                    {item.icon}
                                    {item.label}
                                </Link>
                            ))}
                        </nav>
                    </div>

                    <div className="mt-auto p-4 border-t-2 border-black">
                        <button
                            onClick={() => signOut()}
                            className="flex w-full items-center justify-center gap-3 border-2 border-black bg-white py-3 text-xs font-black uppercase tracking-widest text-black transition-all hover:bg-black hover:text-white"
                        >
                            <LogOut className="h-4 w-4" />
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Header */}
            <header className="lg:hidden flex h-20 items-center justify-between border-b-2 border-black bg-white px-6 sticky top-0 z-40 w-full">
                <div className="flex items-center gap-4">
                    <button
                        onClick={toggleSidebar}
                        className="p-2 border-2 border-black hover:bg-black hover:text-white transition-colors"
                    >
                        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                    <Link className="flex items-center gap-2" href="/">
                        <img src="/logo.png" alt="Echo" className="h-6 w-6" />
                        <span className="text-lg font-black uppercase tracking-tighter text-black">Echo</span>
                    </Link>
                </div>
                <div className="flex items-center gap-3 border-2 border-black bg-neutral-50 px-3 py-1.5">
                    <div className="size-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-tight text-black max-w-[100px] truncate">{session.user.email}</span>
                </div>
            </header>

            {/* Mobile Sidebar Overlay */}
            <div className={cn(
                "fixed inset-0 z-50 bg-black/50 lg:hidden transition-opacity duration-300",
                isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            )} onClick={toggleSidebar}>
                <div
                    className={cn(
                        "fixed inset-y-0 left-0 w-[280px] bg-white border-r-4 border-black transition-transform duration-300 ease-in-out p-6 flex flex-col",
                        isOpen ? "translate-x-0" : "-translate-x-full"
                    )}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between mb-12">
                        <Link className="flex items-center gap-2" href="/" onClick={toggleSidebar}>
                            <img src="/logo.png" alt="Echo" className="h-8 w-8" />
                            <span className="text-2xl font-black uppercase tracking-tighter text-black">Echo</span>
                        </Link>
                        <button onClick={toggleSidebar} className="p-1">
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <nav className="grid gap-4">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                className={cn(
                                    "flex items-center gap-4 border-2 border-transparent px-4 py-4 text-sm font-black uppercase tracking-widest transition-all hover:border-black active:shadow-brutalist",
                                    pathname === item.href ? "text-black border-black bg-black/5" : "text-black/40"
                                )}
                                href={item.href}
                                onClick={toggleSidebar}
                            >
                                {item.icon}
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    <div className="mt-auto pt-8 border-t-2 border-black">
                        <button
                            onClick={() => {
                                toggleSidebar()
                                signOut()
                            }}
                            className="flex w-full items-center justify-center gap-3 border-2 border-black bg-white py-4 text-xs font-black uppercase tracking-widest text-black transition-all hover:bg-black hover:text-white"
                        >
                            <LogOut className="h-4 w-4" />
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}
