"use client";

import { startOfMonth, endOfMonth } from "date-fns";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useInvestments } from "@/hooks/useInvestments";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, MoreVertical, Pencil, Trash2, TrendingUp, DollarSign, Wallet } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Investment } from "@/types";
import { cn } from "@/lib/utils";

const formSchema = z.object({
    name: z.string().min(2, "Nome obrigatório"),
    ticker: z.string().min(2, "Código obrigatório").transform(v => v.toUpperCase()),
    type: z.string(),
    quantity: z.coerce.number().min(0.0001, "Qtd obrigatória"),
    avgPrice: z.coerce.number().min(0.01, "Preço Médio obrigatório"),
});

const dividendSchema = z.object({
    ticker: z.string().min(2, "Ticker obrigatório").transform(v => v.toUpperCase()),
    amount: z.coerce.number().min(0.01, "Valor obrigatório"),
    date: z.coerce.date(),
    type: z.string(),
});

const POPULAR_TICKERS = [
    "PETR4", "VALE3", "ITUB4", "BBAS3", "BBDC4", "MGLU3", "WEGE3", "RENT3", "PRIO3",
    "BTC-USD", "ETH-USD", "HGLG11", "KNRI11", "MXRF11", "XPLG11", "VISC11", "BCFF11",
    "IVVB11", "BOVA11", "SMAL11"
];

export default function InvestmentsPage() {
    const { investments, dividends, addInvestment, updateInvestment, deleteInvestment, addDividend, deleteDividend } = useInvestments();
    const [open, setOpen] = useState(false);
    const [openDividend, setOpenDividend] = useState(false); // form de dividendos
    const [editingInv, setEditingInv] = useState<Investment | null>(null);
    const [prices, setPrices] = useState<Record<string, number>>({});
    const [loadingPrices, setLoadingPrices] = useState(false);

    // Autocomplete State
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            ticker: "",
            type: "stock",
            quantity: 0,
            avgPrice: 0,
        },
    });

    const dividendForm = useForm({
        resolver: zodResolver(dividendSchema),
        defaultValues: {
            ticker: "",
            amount: 0,
            date: new Date(),
            type: "Dividend",
        },
    });

    const updatePrices = async () => {
        setLoadingPrices(true);
        const newPrices: Record<string, number> = {};
        const uniqueTickers = Array.from(new Set(investments.map(i => i.ticker)));

        await Promise.all(uniqueTickers.map(async (ticker) => {
            try {
                const res = await fetch(`/api/quote?ticker=${ticker}`);
                const data = await res.json();
                if (data.price) {
                    newPrices[ticker] = data.price;
                }
            } catch (err) {
                console.error(`Failed to fetch ${ticker}`, err);
            }
        }));

        setPrices(prev => ({ ...prev, ...newPrices }));
        setLoadingPrices(false);
    };

    // Auto-fetch on mount/change
    useEffect(() => {
        updatePrices();
    }, [investments.length]);

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            if (editingInv) {
                await updateInvestment(editingInv.id, {
                    ...values,
                    date: editingInv.date
                });
            } else {
                await addInvestment({
                    ...values,
                    date: new Date()
                });
            }
            setOpen(false);
            form.reset({ name: "", ticker: "", type: "stock", quantity: 0, avgPrice: 0 });
            setEditingInv(null);
            setTimeout(updatePrices, 1000);
        } catch (error) {
            console.error(error);
        }
    };

    const onDividendSubmit = async (values: z.infer<typeof dividendSchema>) => {
        try {
            await addDividend(values);
            setOpenDividend(false);
            dividendForm.reset({ ticker: "", amount: 0, date: new Date(), type: "Dividend" });
        } catch (error) {
            console.error(error);
        }
    };

    const startEdit = (inv: Investment) => {
        setEditingInv(inv);
        form.reset({
            name: inv.name,
            ticker: inv.ticker,
            type: inv.type,
            quantity: inv.quantity,
            avgPrice: inv.avgPrice,
        });
        setOpen(true);
    };

    // Calculations
    const totalInvested = investments.reduce((acc, inv) => acc + (inv.quantity * inv.avgPrice), 0);
    const totalCurrentValue = investments.reduce((acc, inv) => {
        const price = prices[inv.ticker] || inv.avgPrice;
        return acc + (inv.quantity * price);
    }, 0);

    // Dividends
    const totalDividends = dividends.reduce((acc, div) => acc + div.amount, 0);

    const totalProfit = totalCurrentValue - totalInvested;
    const totalReturn = totalProfit + totalDividends; // Lucro Carteira + Proventos

    return (
        <div className="p-8 text-zinc-100 space-y-8 animate-in fade-in duration-500 mb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Investimentos</h1>
                    <p className="text-zinc-400">Carteira de Ativos & Proventos</p>
                </div>

                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={updatePrices}
                        className={cn("text-zinc-400 hover:text-white", loadingPrices && "animate-spin")}
                    >
                        <TrendingUp className="h-5 w-5" />
                    </Button>

                    {/* Botão Novo Provento */}
                    <Dialog open={openDividend} onOpenChange={setOpenDividend}>
                        <DialogTrigger asChild>
                            <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl h-10 px-6 shadow-lg shadow-emerald-500/20">
                                <DollarSign className="h-4 w-4" /> Lançar Proventos
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Novo Provento Recebido</DialogTitle>
                            </DialogHeader>
                            <Form {...dividendForm}>
                                <form onSubmit={dividendForm.handleSubmit(onDividendSubmit)} className="space-y-4">
                                    <FormField
                                        control={dividendForm.control}
                                        name="ticker"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Ativo (Ticker)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="PETR4" {...field} className="bg-zinc-950 border-zinc-800 uppercase" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={dividendForm.control}
                                            name="amount"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Valor (R$)</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" step="0.01" {...field} value={field.value as string | number | undefined} className="bg-zinc-950 border-zinc-800" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={dividendForm.control}
                                            name="date"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Data Recebimento</FormLabel>
                                                    <FormControl>
                                                        <Input type="date"
                                                            value={field.value ? format(field.value as Date, 'yyyy-MM-dd') : ''}
                                                            onChange={(e) => field.onChange(new Date(e.target.value))}
                                                            className="bg-zinc-950 border-zinc-800"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 font-semibold">
                                        Salvar Provento
                                    </Button>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>

                    {/* Botão Novo Ativo (Original) */}
                    <Dialog open={open} onOpenChange={(val) => {
                        setOpen(val);
                        if (!val) {
                            setEditingInv(null);
                            form.reset();
                        }
                    }}>
                        <DialogTrigger asChild>
                            <Button className="gap-2 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-xl h-10 px-6 shadow-lg shadow-purple-500/20">
                                <Plus className="h-4 w-4" /> Novo Ativo
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 sm:max-w-[425px] overflow-y-visible">
                            <DialogHeader>
                                <DialogTitle>{editingInv ? "Editar Investimento" : "Novo Investimento"}</DialogTitle>
                            </DialogHeader>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="ticker"
                                            render={({ field }) => (
                                                <FormItem className="relative">
                                                    <FormLabel>Código (Ticker)</FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <Input
                                                                placeholder="PETR4"
                                                                {...field}
                                                                className="bg-zinc-950 border-zinc-800 focus:ring-purple-500 uppercase"
                                                                autoComplete="off"
                                                                onChange={(e) => {
                                                                    const val = e.target.value.toUpperCase();
                                                                    field.onChange(val);
                                                                    if (val.length > 0) {
                                                                        const filtered = POPULAR_TICKERS.filter(t => t.includes(val));
                                                                        setSuggestions(filtered);
                                                                        setShowSuggestions(true);
                                                                    } else {
                                                                        setShowSuggestions(false);
                                                                    }
                                                                }}
                                                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                                            />
                                                            {showSuggestions && suggestions.length > 0 && (
                                                                <ul className="absolute z-50 w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-md shadow-lg max-h-40 overflow-y-auto">
                                                                    {suggestions.map(s => (
                                                                        <li
                                                                            key={s}
                                                                            className="px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 cursor-pointer"
                                                                            onClick={() => {
                                                                                field.onChange(s);
                                                                                setShowSuggestions(false);
                                                                            }}
                                                                        >
                                                                            {s}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            )}
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="type"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Tipo</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="bg-zinc-950 border-zinc-800 focus:ring-purple-500">
                                                                <SelectValue placeholder="Selecione o tipo" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                                                            <SelectItem value="stock">Ação</SelectItem>
                                                            <SelectItem value="fii">FII</SelectItem>
                                                            <SelectItem value="crypto">Cripto</SelectItem>
                                                            <SelectItem value="fixed">Renda Fixa</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nome (Opcional)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Petrobras PN" {...field} className="bg-zinc-950 border-zinc-800 focus:ring-purple-500" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="quantity"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Quantidade</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" step="0.0001" {...field} value={field.value as string | number | undefined} className="bg-zinc-950 border-zinc-800 focus:ring-purple-500" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="avgPrice"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Preço Médio</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" step="0.01" {...field} value={field.value as string | number | undefined} className="bg-zinc-950 border-zinc-800 focus:ring-purple-500" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <Button type="submit" className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold">
                                        Salvar
                                    </Button>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="rounded-[2rem] border-0 bg-white/5 ring-1 ring-white/10">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">Total Investido</CardTitle>
                        <Wallet className="h-4 w-4 text-zinc-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-zinc-300">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalInvested)}
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-[2rem] border-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 ring-1 ring-white/10">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">Valor de Mercado</CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalCurrentValue)}
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-[2rem] border-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 ring-1 ring-white/10">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">Proventos (Total)</CardTitle>
                        <div className="flex gap-2">
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-500 hover:text-white">
                                        <MoreVertical className="h-3 w-3" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 sm:max-w-[425px]">
                                    <DialogHeader>
                                        <DialogTitle>Histórico de Proventos</DialogTitle>
                                    </DialogHeader>
                                    <div className="max-h-[300px] overflow-y-auto space-y-2">
                                        {dividends.map(div => (
                                            <div key={div.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                                                <div>
                                                    <p className="font-bold text-white">{div.ticker}</p>
                                                    <p className="text-xs text-zinc-500">{format(div.date, "dd/MM/yyyy")}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-emerald-400">
                                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(div.amount)}
                                                    </span>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 text-zinc-500 hover:text-red-400"
                                                        onClick={() => {
                                                            if (confirm("Excluir este provento?")) deleteDividend(div.id);
                                                        }}
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                        {dividends.length === 0 && <p className="text-center text-zinc-500 py-4">Nenhum registro.</p>}
                                    </div>
                                </DialogContent>
                            </Dialog>
                            <DollarSign className="h-4 w-4 text-blue-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-400">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalDividends)}
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-[2rem] border-0 bg-white/5 ring-1 ring-white/10">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">Retorno Total</CardTitle>
                        <TrendingUp className="h-4 w-4 text-zinc-200" />
                    </CardHeader>
                    <CardContent>
                        <div className={cn("text-2xl font-bold", totalReturn >= 0 ? "text-emerald-400" : "text-red-400")}>
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalReturn)}
                            <span className="text-sm font-normal ml-2 opacity-70">
                                ({totalInvested > 0 ? ((totalReturn / totalInvested) * 100).toFixed(2) : 0}%)
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* List */}
            <div className="grid gap-4">
                {investments.map((inv) => {
                    const currentPrice = prices[inv.ticker] || inv.avgPrice;
                    const currentValue = inv.quantity * currentPrice;
                    const investedValue = inv.quantity * inv.avgPrice;
                    const profit = currentValue - investedValue;
                    const profitPercent = investedValue > 0 ? (profit / investedValue) * 100 : 0;

                    return (
                        <Card key={inv.id} className="rounded-2xl border-0 bg-white/5 ring-1 ring-white/10 hover:bg-white/10 transition-colors">
                            <div className="flex items-center justify-between p-6">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "p-3 rounded-xl flex items-center justify-center w-12 h-12 text-lg font-bold",
                                        inv.type === 'crypto' ? "bg-orange-500/20 text-orange-400" :
                                            inv.type === 'stock' ? "bg-blue-500/20 text-blue-400" :
                                                "bg-emerald-500/20 text-emerald-400"
                                    )}>
                                        {inv.ticker ? inv.ticker.substring(0, 2) : "I"}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white">{inv.ticker}</h3>
                                        <p className="text-sm text-zinc-400">{inv.name}</p>
                                    </div>
                                </div>

                                <div className="hidden md:flex flex-col items-end">
                                    <p className="text-xs text-zinc-500 uppercase">Preço Médio</p>
                                    <p className="font-medium text-zinc-300">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(inv.avgPrice)}</p>
                                </div>

                                <div className="hidden md:flex flex-col items-end">
                                    <p className="text-xs text-zinc-500 uppercase">Preço Atual</p>
                                    <p className="font-medium text-white">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(currentPrice)}</p>
                                </div>

                                <div className="text-right">
                                    <p className="text-xs text-zinc-500 uppercase">Saldo</p>
                                    <p className="font-bold text-white text-lg">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(currentValue)}</p>
                                    <span className={cn("text-xs", profit >= 0 ? "text-emerald-400" : "text-red-400")}>
                                        {profit >= 0 ? '+' : ''} {profitPercent.toFixed(2)}%
                                    </span>
                                </div>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-white">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
                                        <DropdownMenuItem onClick={() => startEdit(inv)} className="text-zinc-300 hover:text-purple-400">
                                            <Pencil className="mr-2 h-4 w-4" /> Editar
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => {
                                                if (confirm("Excluir investimento?")) deleteInvestment(inv.id);
                                            }}
                                            className="text-red-400 hover:text-red-300 hover:bg-red-950/20"
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </Card>
                    );
                })}

                {investments.length === 0 && (
                    <div className="text-center py-12 text-zinc-500">
                        Nenhum ativo cadastrado.
                    </div>
                )}
            </div>
        </div>
    );
}
