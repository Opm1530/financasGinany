"use client";

import { useEffect, useMemo } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import { useCategories } from "@/hooks/useCategories";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, TrendingUp, TrendingDown, CreditCard, Banknote } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ExtratoPage() {
    const { transactions, subscribeToAllTransactions, deleteTransaction } = useTransactions();
    const { categories } = useCategories();

    // Create a map for faster lookup
    const categoryMap = useMemo(() => {
        const map = new Map<string, string>();
        categories.forEach(cat => map.set(cat.id, cat.name));
        return map;
    }, [categories]);

    useEffect(() => {
        const unsubscribe = subscribeToAllTransactions();
        return () => unsubscribe();
    }, [subscribeToAllTransactions]);

    return (
        <div className="p-8 text-zinc-100 space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Extrato</h1>
                    <p className="text-zinc-400">Histórico completo de transações</p>
                </div>
            </div>

            <Card className="rounded-[2rem] border-0 bg-white/5 backdrop-blur-md ring-1 ring-white/10 shadow-xl overflow-hidden">
                <CardHeader>
                    <CardTitle className="text-zinc-300 text-sm font-medium uppercase tracking-wider">Todas as Movimentações</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-white/5 text-zinc-400 font-medium">
                                <tr>
                                    <th className="px-6 py-4">Data</th>
                                    <th className="px-6 py-4">Descrição</th>
                                    <th className="px-6 py-4">Categoria</th>
                                    <th className="px-6 py-4">Método</th>
                                    <th className="px-6 py-4">Valor</th>
                                    <th className="px-6 py-4 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                                            Nenhuma transação encontrada.
                                        </td>
                                    </tr>
                                ) : (
                                    transactions.map((tx) => (
                                        <tr key={tx.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap text-zinc-300">
                                                {format(tx.date, "dd/MM/yyyy", { locale: ptBR })}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-white">{tx.description}</span>
                                                    {tx.installments && (
                                                        <span className="text-xs text-zinc-500">
                                                            Parcela {tx.installments.current}/{tx.installments.total}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-zinc-300">
                                                <Badge variant="outline" className="border-white/10 bg-white/5 text-zinc-400 font-normal">
                                                    {categoryMap.get(tx.categoryId) || "Outros"}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-zinc-300">
                                                    {tx.paymentMethod === 'CREDIT_CARD' ? <CreditCard className="h-4 w-4" /> : <Banknote className="h-4 w-4" />}
                                                    <span className="text-xs capitalize">{tx.paymentMethod === 'CREDIT_CARD' ? 'Cartão' : 'Dinheiro'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-medium">
                                                <span className={tx.type === 'INCOME' ? 'text-emerald-400' : 'text-zinc-200'}>
                                                    {tx.type === 'INCOME' ? '+' : '-'} {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(tx.amount)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (window.confirm("Tem certeza que deseja excluir esta transação?")) {
                                                            deleteTransaction(tx.id);
                                                        }
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
