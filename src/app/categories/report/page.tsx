"use client";

import { useState } from "react";
import { useDashboardData } from "@/hooks/useDashboardData";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, ChevronLeft, BarChart3, TrendingDown, TrendingUp, AlertCircle } from "lucide-react";
import { format, subMonths, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";

export default function CategoryReportPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const { categorySummaries, totalExpense, loading } = useDashboardData(currentDate);

    // Filter categories that have spending > 0
    const activeCategories = categorySummaries.filter(cat => cat.spent > 0);

    return (
        <div className="space-y-8 animate-in fade-in duration-500 p-8 text-zinc-100">
            {/* Header / Navigation */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/categories">
                        <Button variant="ghost" size="icon" className="rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white">
                            <ChevronLeft className="h-6 w-6" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-white">Relatório de Gastos</h1>
                        <p className="text-zinc-400 font-medium">Análise por categoria</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-white/5 p-1 rounded-2xl border border-white/5 backdrop-blur-md">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                        className="rounded-xl hover:bg-white/10"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="w-32 text-center font-medium capitalize text-zinc-200">
                        {format(currentDate, "MMMM yyyy", { locale: ptBR })}
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                        className="rounded-xl hover:bg-white/10"
                    >
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Top Summary Card */}
            <Card className="rounded-[2.5rem] border-0 bg-gradient-to-br from-zinc-900 via-zinc-900 to-black ring-1 ring-white/10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full -mr-32 -mt-32" />
                <CardContent className="p-8 relative">
                    <div className="grid md:grid-cols-2 gap-8 items-center">
                        <div>
                            <p className="text-sm text-zinc-400 uppercase tracking-widest font-semibold mb-2">Total Gasto no Período</p>
                            <div className="text-5xl font-bold text-white tracking-tight">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalExpense)}
                            </div>
                            <div className="mt-4 flex items-center gap-2 text-zinc-400">
                                <BarChart3 className="h-4 w-4 text-emerald-500" />
                                <span>{activeCategories.length} categorias com atividade</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-3xl bg-white/5 border border-white/5">
                                <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Média p/ Categoria</p>
                                <p className="text-xl font-bold text-white">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(activeCategories.length > 0 ? totalExpense / activeCategories.length : 0)}
                                </p>
                            </div>
                            <div className="p-4 rounded-3xl bg-white/5 border border-white/5">
                                <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Status Geral</p>
                                <div className="flex items-center gap-1.5 text-emerald-400 text-sm font-bold">
                                    <TrendingDown className="h-4 w-4" />
                                    <span>Controlado</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Categories List */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-white px-2">Detalhamento</h2>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-zinc-500 gap-4">
                        <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                        <p className="font-medium">Carregando dados do relatório...</p>
                    </div>
                ) : activeCategories.length === 0 ? (
                    <Card className="rounded-[2rem] border-0 bg-white/5 border-dashed border-white/10 p-12 text-center">
                        <AlertCircle className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-zinc-400">Nenhum gasto encontrado</h3>
                        <p className="text-zinc-500">Não houve movimentações nas categorias neste mês.</p>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {activeCategories.map((cat) => {
                            const percentageOfTotal = (cat.spent / totalExpense) * 100;
                            const percentageOfBudget = Math.min((cat.spent / cat.budgetLimit) * 100, 100);
                            const isOverBudget = cat.spent > cat.budgetLimit;

                            return (
                                <Card key={cat.id} className="rounded-[2rem] border-0 bg-white/5 backdrop-blur-md ring-1 ring-white/10 hover:ring-white/20 transition-all overflow-hidden group">
                                    <CardContent className="p-6">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">{cat.name}</h3>
                                                    <span className="text-sm font-bold text-zinc-400 md:hidden">
                                                        {percentageOfTotal.toFixed(1)}% do total
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-6">
                                                    <div>
                                                        <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-1">Gasto</p>
                                                        <p className="text-2xl font-black text-white">
                                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cat.spent)}
                                                        </p>
                                                    </div>
                                                    <div className="h-10 w-px bg-white/10 hidden md:block" />
                                                    <div className="hidden md:block">
                                                        <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-1">Representatividade</p>
                                                        <p className="text-xl font-bold text-zinc-300">
                                                            {percentageOfTotal.toFixed(1)}%
                                                        </p>
                                                    </div>
                                                    <div className="h-10 w-px bg-white/10" />
                                                    <div>
                                                        <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-1">Orçamento</p>
                                                        <p className="text-xl font-bold text-zinc-400">
                                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cat.budgetLimit)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="w-full md:w-64 space-y-2">
                                                <div className="flex justify-between text-xs font-bold uppercase tracking-tighter">
                                                    <span className={isOverBudget ? "text-red-400" : "text-emerald-400"}>
                                                        {isOverBudget ? "Orçamento Excedido" : "Dentro do Limite"}
                                                    </span>
                                                    <span className="text-zinc-500">{percentageOfBudget.toFixed(0)}%</span>
                                                </div>
                                                <Progress
                                                    value={percentageOfBudget}
                                                    className="h-3 bg-white/10"
                                                    indicatorClassName={isOverBudget ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" : "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"}
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
