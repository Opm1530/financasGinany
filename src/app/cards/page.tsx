"use client";

import { useState } from "react";
import { useCreditCards } from "@/hooks/useCreditCards";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, MoreVertical, Pencil, Trash2, CreditCard as CardIcon } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { CreditCard as ICreditCard } from "@/types";

// 👇 CORREÇÃO: Usando string().pipe() para converter corretamente
const formSchema = z.object({
    name: z.string().min(2, "Nome muito curto"),
    limit: z.string().pipe(z.coerce.number().min(0.01, "Limite deve ser positivo")),
    closingDay: z.string().pipe(z.coerce.number().min(1).max(31, "Dia inválido (1-31)")),
    dueDay: z.string().pipe(z.coerce.number().min(1).max(31, "Dia inválido (1-31)")),
});

type CardFormValues = z.infer<typeof formSchema>;

export default function CardsPage() {
    const { cards, addCard, updateCard, deleteCard } = useCreditCards();
    const [open, setOpen] = useState(false);
    const [editingCard, setEditingCard] = useState<ICreditCard | null>(null);

    const form = useForm<CardFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            limit: 0,
            closingDay: 1,
            dueDay: 10
        },
    });

    const onSubmit = async (values: CardFormValues) => {
        try {
            if (editingCard) {
                await updateCard(editingCard.id, values);
            } else {
                await addCard(values);
            }
            setOpen(false);
            form.reset({
                name: "",
                limit: 0,
                closingDay: 1,
                dueDay: 10
            });
            setEditingCard(null);
        } catch (error) {
            console.error(error);
        }
    };

    const startEdit = (card: ICreditCard) => {
        setEditingCard(card);
        form.setValue("name", card.name);
        form.setValue("limit", card.limit);
        form.setValue("closingDay", card.closingDay);
        form.setValue("dueDay", card.dueDay);
        setOpen(true);
    };

    return (
        <div className="p-8 text-zinc-100 space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Cartões de Crédito</h1>
                    <p className="text-zinc-400">Gerencie seus limites e faturas</p>
                </div>

                <Dialog open={open} onOpenChange={(val) => {
                    setOpen(val);
                    if (!val) {
                        setEditingCard(null);
                        form.reset();
                    }
                }}>
                    <DialogTrigger asChild>
                        <Button className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-black font-semibold rounded-xl h-10 px-6">
                            <Plus className="h-4 w-4" /> Novo Cartão
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>{editingCard ? "Editar Cartão" : "Novo Cartão"}</DialogTitle>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nome do Cartão</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ex: Nubank" {...field} className="bg-zinc-950 border-zinc-800 focus-visible:ring-emerald-500" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="limit"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Limite Total (R$)</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.01" {...field} className="bg-zinc-950 border-zinc-800 focus-visible:ring-emerald-500" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="closingDay"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Dia Fechamento</FormLabel>
                                                <FormControl>
                                                    <Input type="number" min="1" max="31" {...field} className="bg-zinc-950 border-zinc-800 focus-visible:ring-emerald-500" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="dueDay"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Dia Vencimento</FormLabel>
                                                <FormControl>
                                                    <Input type="number" min="1" max="31" {...field} className="bg-zinc-950 border-zinc-800 focus-visible:ring-emerald-500" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <Button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-semibold">
                                    Salvar
                                </Button>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {cards.map((card) => (
                    <Card key={card.id} className="relative overflow-hidden rounded-[2rem] border-0 bg-gradient-to-br from-zinc-800 to-zinc-900 ring-1 ring-white/10 group shadow-lg hover:shadow-2xl transition-all hover:scale-[1.02]">
                        {/* Ambient Background for Card */}
                        <div className="absolute right-0 top-0 h-32 w-32 translate-x-12 -translate-y-12 rounded-full bg-emerald-500/20 blur-3xl group-hover:bg-emerald-500/30 transition-colors" />

                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-white/5 rounded-2xl ring-1 ring-white/10">
                                    <CardIcon className="h-5 w-5 text-emerald-400" />
                                </div>
                                <CardTitle className="text-lg font-medium text-white">
                                    {card.name}
                                </CardTitle>
                            </div>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg">
                                        <span className="sr-only">Menu</span>
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
                                    <DropdownMenuItem onClick={() => startEdit(card)} className="text-zinc-300 hover:text-emerald-400">
                                        <Pencil className="mr-2 h-4 w-4" /> Editar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => deleteCard(card.id)}
                                        className="text-red-400 hover:text-red-300 hover:bg-red-950/20"
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </CardHeader>
                        <CardContent className="relative z-10 pt-6">
                            <div className="space-y-6">
                                <div>
                                    <p className="text-xs text-zinc-400 uppercase tracking-widest font-medium">Limite Disponível</p>
                                    <div className="text-3xl font-bold text-white mt-1">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(card.availableLimit ?? card.limit)}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-xs">
                                    <div className="bg-black/30 p-3 rounded-2xl border border-white/5 backdrop-blur-sm">
                                        <span className="block text-zinc-500 mb-1">Fecha dia</span>
                                        <span className="text-white text-lg font-bold font-mono">{String(card.closingDay).padStart(2, '0')}</span>
                                    </div>
                                    <div className="bg-black/30 p-3 rounded-2xl border border-white/5 backdrop-blur-sm">
                                        <span className="block text-zinc-500 mb-1">Vence dia</span>
                                        <span className="text-white text-lg font-bold font-mono">{String(card.dueDay).padStart(2, '0')}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}