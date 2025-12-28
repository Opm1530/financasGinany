"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Wallet, PieChart, CreditCard, FileText, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileNav() {
    const pathname = usePathname();

    const links = [
        { href: "/", label: "Home", icon: LayoutDashboard },
        { href: "/extrato", label: "Extrato", icon: FileText },
        { href: "/investments", label: "Investir", icon: TrendingUp },
        { href: "/categories", label: "Categorias", icon: PieChart },
        { href: "/cards", label: "Cartões", icon: CreditCard },
    ];

    return (
        <nav className="fixed bottom-4 left-4 right-4 z-50 rounded-2xl border border-white/10 bg-zinc-900/80 backdrop-blur-xl shadow-2xl md:hidden">
            <div className="flex items-center justify-around p-2">
                {links.map((link) => {
                    const Icon = link.icon;
                    const isActive = pathname === link.href;

                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all w-full",
                                isActive ? "bg-emerald-500/10 text-emerald-400" : "text-zinc-500 hover:text-zinc-300"
                            )}
                        >
                            <Icon className={cn("h-6 w-6", isActive && "fill-current")} />
                            <span className="text-[10px] font-medium">{link.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
