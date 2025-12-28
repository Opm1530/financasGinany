"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Wallet, CreditCard, PieChart, LogOut, Settings, FileText, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

export function Sidebar() {
    const pathname = usePathname();
    const { signOut } = useAuth();

    const links = [
        { href: "/", label: "Dashboard", icon: LayoutDashboard },
        { href: "/investments", label: "Investimentos", icon: TrendingUp },
        { href: "/extrato", label: "Extrato", icon: FileText },
        { href: "/categories", label: "Categorias", icon: PieChart },
        { href: "/cards", label: "Cartões", icon: CreditCard },
    ];

    return (
        <aside className="fixed left-4 top-4 bottom-4 z-50 w-20 flex-col items-center justify-between rounded-3xl border border-white/10 bg-white/5 py-8 backdrop-blur-xl transition-all hover:w-64 group shadow-2xl hidden md:flex">
            {/* Search / Brand placeholder */}
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-md shadow-lg shadow-black/10"
>
                <img src="/logo.png" alt="Logo" className="h-8 w-8" />
            </div>

            <nav className="flex flex-1 flex-col items-center gap-4 py-8 w-full">
                {links.map((link) => {
                    const Icon = link.icon;
                    const isActive = pathname === link.href;
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "relative flex h-12 w-full items-center justify-center gap-4 px-4 text-zinc-400 transition-all hover:text-white group-hover:justify-start",
                                isActive && "text-white"
                            )}
                        >
                            <div className={cn(
                                "flex h-10 w-10 items-center justify-center rounded-xl transition-all",
                                isActive ? "bg-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]" : "bg-transparent"
                            )}>
                                <Icon className="h-5 w-5" />
                            </div>
                            <span className={cn("hidden whitespace-nowrap text-sm font-medium opacity-0 transition-all group-hover:block group-hover:opacity-100", isActive && "text-emerald-400")}>
                                {link.label}
                            </span>
                            {isActive && (
                                <div className="absolute right-0 h-8 w-1 rounded-l-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="flex w-full flex-col gap-4 px-2">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={signOut}
                    className="h-10 w-full justify-center rounded-xl hover:bg-red-500/10 hover:text-red-400 group-hover:justify-start group-hover:px-4"
                >
                    <LogOut className="h-5 w-5" />
                    <span className="hidden ml-3 text-sm font-medium group-hover:block">Sair</span>
                </Button>
            </div>
        </aside>
    );
}
