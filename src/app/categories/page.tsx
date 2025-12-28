"use client";

import { useState } from "react";
import { useCategories } from "@/hooks/useCategories";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, MoreVertical, Pencil, Trash2 } from "lucide-react";
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
import Link from "next/link";
import { BarChart3 } from "lucide-react";

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
import { Category } from "@/types";

const formSchema = z.object({
    name: z.string().min(2, "Nome muito curto"),
    budgetLimit: z.coerce.number().min(0.01, "Valor deve ser maior que zero"),
});
import { Progress } from "@/components/ui/progress";
import { useDashboardData } from "@/hooks/useDashboardData";

type CategoryFormValues = z.infer<typeof formSchema>;

export default function CategoriesPage() {
    const { addCategory, updateCategory, deleteCategory } = useCategories();
    // Use state to keep the date reference stable across renders
    const [currentDate] = useState(() => new Date());
    const { categorySummaries, loading } = useDashboardData(currentDate);

    const [open, setOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    const form = useForm<CategoryFormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            name: "",
            budgetLimit: 0,
        },
    });


    const onSubmit = async (values: CategoryFormValues) => {
        try {
            if (editingCategory) {
                await updateCategory(editingCategory.id, {
                    name: values.name,
                    budgetLimit: values.budgetLimit
                });
            } else {
                await addCategory(values.name, values.budgetLimit);
            }
            setOpen(false);
            form.reset({
                name: "",
                budgetLimit: 0,
            });
            setEditingCategory(null);
        } catch (error) {
            console.error(error);
        }
    };

    const startEdit = (cat: Category) => {
        setEditingCategory(cat);
        form.setValue("name", cat.name);
        form.setValue("budgetLimit", cat.budgetLimit);
        setOpen(true);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 p-8 text-zinc-100">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Categorias</h1>
                    <p className="text-zinc-400">Gerencie seus limites mensais</p>
                </div>

                <div className="flex items-center gap-3">
                    <Link href="/categories/report">
                        <Button variant="outline" className="gap-2 border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-xl h-10 px-6">
                            <BarChart3 className="h-4 w-4" /> Relatório
                        </Button>
                    </Link>

                    <Dialog open={open} onOpenChange={(val) => {
                        setOpen(val);
                        if (!val) {
                            setEditingCategory(null);
                            form.reset();
                        }
                    }}>
                        <DialogTrigger asChild>
                            <Button className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-black font-semibold rounded-xl h-10 px-6">
                                <Plus className="h-4 w-4" /> Nova
                            </Button>
                        </DialogTrigger>

                        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>{editingCategory ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
                            </DialogHeader>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nome</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Ex: Alimentação" {...field} className="bg-zinc-950 border-zinc-800 focus-visible:ring-emerald-500" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="budgetLimit"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Orçamento Mensal (R$)</FormLabel>
                                                <FormControl>
<Input
  type="number"
  step="0.01"
  placeholder="1000.00"
  value={field.value ?? ""}
  onChange={(e) => field.onChange(e.target.value)}
  className="bg-zinc-950 border-zinc-800 focus-visible:ring-emerald-500"
/>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-semibold">
                                        Salvar
                                    </Button>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {categorySummaries.map((cat) => {
                    const percentage = Math.min((cat.spent / cat.budgetLimit) * 100, 100);
                    const isOverBudget = cat.spent > cat.budgetLimit;

                    return (
                        <Card key={cat.id} className="rounded-[2rem] border-0 bg-white/5 backdrop-blur-md ring-1 ring-white/10 hover:ring-emerald-500/50 transition-all group overflow-hidden">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-lg font-medium text-white group-hover:text-emerald-400 transition-colors">
                                    {cat.name}
                                </CardTitle>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg">
                                            <span className="sr-only">Menu</span>
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
                                        <DropdownMenuItem onClick={() => startEdit(cat)} className="text-zinc-300 hover:text-emerald-400">
                                            <Pencil className="mr-2 h-4 w-4" /> Editar
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => deleteCategory(cat.id)}
                                            className="text-red-400 hover:text-red-300 hover:bg-red-950/20"
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">
                                                Gasto no mês
                                            </p>
                                            <div className="text-2xl font-bold text-white/90">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cat.spent)}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
                                                Limite
                                            </p>
                                            <div className="text-sm font-medium text-zinc-300">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cat.budgetLimit)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Progress value={percentage} className="h-2 bg-white/10" indicatorClassName={isOverBudget ? "bg-red-500" : "bg-emerald-500"} />
                                        <div className="flex justify-between text-xs text-zinc-500">
                                            <span>{percentage.toFixed(0)}% utilizado</span>
                                            <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.max(0, cat.budgetLimit - cat.spent))} resta</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
