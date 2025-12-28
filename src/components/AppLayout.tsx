"use client";

import { Sidebar } from "@/components/Sidebar";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { MobileNav } from "@/components/MobileNav";

export function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { user } = useAuth(); // We might want to only show sidebar if logged in

    const isLoginPage = pathname === "/login";

    if (isLoginPage) {
        return <main className="min-h-screen bg-zinc-950">{children}</main>;
    }

    return (
        <div className="flex min-h-screen bg-[#0f0f11] text-zinc-100 selection:bg-emerald-500/30">
            {/* Ambient Background Glows */}
            <div className="fixed -top-40 -left-40 h-96 w-96 rounded-full bg-emerald-500/20 blur-[128px]" />
            <div className="fixed -bottom-40 -right-40 h-96 w-96 rounded-full bg-purple-500/10 blur-[128px]" />

            {user && <Sidebar />}

            <main className={cn(
                "relative flex-1 p-4 md:p-8 transition-all duration-300 mb-20 md:mb-0", // Added mb-20 for mobile nav
                user ? "md:ml-24" : ""
            )}>
                {/* Top glass navbar for mobile could go here */}
                {children}
            </main>

            {user && <MobileNav />}
        </div>
    );
}

import { cn } from "@/lib/utils";
