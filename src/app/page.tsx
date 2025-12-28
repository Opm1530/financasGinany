"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useInvestments } from "@/hooks/useInvestments";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Minus, Wallet, TrendingUp, TrendingDown, ArrowRight, ArrowLeft, DollarSign, PiggyBank } from "lucide-react";
import { format, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";


import { Area, AreaChart, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from "recharts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useState, useEffect } from "react";
import NewTransactionForm from "@/components/NewTransactionForm";




export default function Dashboard() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());

  // Dashboard Data (Cash Flow)
  const {
    totalIncome,
    totalExpense,
    previousBalance,
    balance, // This is Month Balance
    categorySummaries,
    loading: dataLoading,
    transactions
  } = useDashboardData(currentDate);

  // Investments Data (Net Worth)
  const { investments, dividends } = useInvestments();
  const [prices, setPrices] = useState<Record<string, number>>({});

  // Fetch Prices Logic (Reused for Dashboard)
  useEffect(() => {
    const fetchPrices = async () => {
      const newPrices: Record<string, number> = {};
      const uniqueTickers = Array.from(new Set(investments.map(i => i.ticker)));

      if (uniqueTickers.length === 0) return;

      await Promise.all(uniqueTickers.map(async (ticker) => {
        try {
          const res = await fetch(`/api/quote?ticker=${ticker}`);
          const data = await res.json();
          if (data.price) {
            newPrices[ticker] = data.price;
          }
        } catch (err) {
          // Silent catch
        }
      }));

      setPrices(prev => ({ ...prev, ...newPrices }));
    };

    if (investments.length > 0) {
      fetchPrices();
    }
  }, [investments.length]);

  // Calculations
  const totalDividends = dividends.reduce((acc, div) => acc + div.amount, 0);
  const totalInvestmentValue = investments.reduce((acc, inv) => {
    const price = prices[inv.ticker] || inv.avgPrice;
    return acc + (inv.quantity * price);
  }, 0);

  // Patrimônio Total = (Saldo Anterior + Receitas - Despesas) + Valor Investimentos + Dividendos Totais
  // Note: 'balance' from hook is (Previous + Income - Expense)
  // Dividendos usually enter as 'Income' if user registers them as transactions too. 
  // Assuming they are separate based on previous prompt ("não quero misturar").
  const totalNetWorth = balance + totalInvestmentValue + totalDividends;

  const [openNewTrans, setOpenNewTrans] = useState(false);

  // Chart Logic (Mock data for daily flow, using monthly totals for now)
  const chartData = transactions.map(t => ({
    name: format(t.date, 'dd/MM'),
    value: t.type === 'INCOME' ? t.amount : -t.amount
  })).reverse().slice(0, 10);

  return (
    <div className="p-8 text-zinc-100 space-y-8 animate-in fade-in duration-500 mb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">Visão Geral</h1>
          <p className="text-zinc-400">
            {format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>

        {/* Date Navigation */}
        <div className="flex items-center gap-4 bg-white/5 p-1 rounded-2xl border border-white/5 backdrop-blur-md">
          <Button variant="ghost" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="rounded-xl hover:bg-white/10">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="w-32 text-center font-medium capitalize text-zinc-200">
            {format(currentDate, "MMMM yyyy", { locale: ptBR })}
          </div>
          <Button variant="ghost" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="rounded-xl hover:bg-white/10">
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Patrimônio Card (Full Width) - Adjusted Height ~200px */}
      <Card className="rounded-[2rem] border-0 bg-gradient-to-r from-zinc-900 to-zinc-950 ring-1 ring-white/10 shadow-2xl relative overflow-hidden h-[120px]">
        <div className="absolute top-0 right-0 p-32 bg-purple-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        <CardContent className="h-full flex flex-col items-center justify-center text-center space-y-2 relative z-10 p-6">
          <span className="text-zinc-400 font-medium uppercase tracking-wider text-xs flex items-center gap-2">
            
            Patrimônio Total Estimado
          </span>
          <div className="text-5xl font-bold text-white tracking-tight">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalNetWorth || 0)}
          </div>
          <p className="text-sm text-zinc-500">
            Soma de Saldo em Conta + Investimentos + Proventos
          </p>
        </CardContent>
      </Card>

      {/* Main Grid: Summary Cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">

        {/* Card Saldo Anterior */}
        <Card className="rounded-[2rem] border-0 bg-white/5 ring-1 ring-white/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Saldo Anterior</CardTitle>
            <Wallet className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-300">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(previousBalance || 0)}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 ring-1 ring-white/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Receitas</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalIncome)}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              +0% em relação ao mês anterior
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-0 bg-gradient-to-br from-red-500/10 to-pink-500/10 ring-1 ring-white/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Despesas</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalExpense)}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              -0% em relação ao mês anterior
            </p>
          </CardContent>
        </Card>

        {/* Card Saldo Previsto (Accumulated) */}
        <Card className="rounded-[2rem] border-0 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 ring-1 ring-white/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Saldo Previsto</CardTitle>
            <Wallet className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(balance || 0)}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Final do Mês
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Chart Section */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-[2rem] border-0 bg-white/5 backdrop-blur-md ring-1 ring-white/10 shadow-xl h-80 flex flex-col">
            <CardHeader>
              <CardTitle className="text-zinc-200">Fluxo de Caixa</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 relative">
              <div className="absolute inset-0 p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: '#18181b', borderRadius: '12px', border: 'none' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#8b5cf6"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorValue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Recent Transactions List (Optional - can be expanded) */}
        </div>

        {/* Sidebar / Quick Actions */}
        <div className="space-y-6">
          {/* Botão Nova Transação */}
          <Card className="rounded-[2rem] border-0 bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 bg-opacity-40 backdrop-blur-xl ring-1 ring-white/10 shadow-xl overflow-hidden group">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <Dialog open={openNewTrans} onOpenChange={setOpenNewTrans}>
                <DialogTrigger asChild>
                  <Button className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-xl shadow-purple-500/20 rounded-2xl transition-all duration-300 transform group-hover:scale-[1.02] text-zinc-100 cursor-pointer" >
                    <Plus className="mr-2 h-5 w-5 text-zinc-100" /> Nova Transação
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Nova Transação</DialogTitle>
                  </DialogHeader>
                  <NewTransactionForm onSuccess={() => setOpenNewTrans(false)} />
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Latest Activity */}
          <Card className="rounded-[2rem] border-0 bg-white/5 backdrop-blur-md ring-1 ring-white/10 shadow-xl">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Últimas Atividades</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {transactions.slice(0, 5).map(t => (
                <div key={t.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-full bg-opacity-10 transition-colors",
                      t.type === 'INCOME' ? "bg-emerald-500 text-emerald-400" : "bg-red-500 text-red-400"
                    )}>
                      {t.type === 'INCOME' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="font-medium text-zinc-200 group-hover:text-white transition-colors">{t.description}</p>
                      <p className="text-xs text-zinc-500">{format(t.date, 'dd/MM/yyyy')}</p>
                    </div>
                  </div>
                  <span className={cn(
                    "font-medium",
                    t.type === 'INCOME' ? "text-emerald-400" : "text-red-400"
                  )}>
                    {t.type === 'INCOME' ? '+' : '-'} {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount)}
                  </span>
                </div>
              ))}
              {transactions.length === 0 && <p className="text-center text-zinc-500 text-sm">Nenhuma atividade recente.</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
