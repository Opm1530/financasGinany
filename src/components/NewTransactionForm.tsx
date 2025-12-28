"use client";

import { useState } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import { useCategories } from "@/hooks/useCategories";
import { useCreditCards } from "@/hooks/useCreditCards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const formSchema = z.object({
  description: z.string().min(2),
  amount: z.coerce.number().positive("Valor positivo"),
  categoryId: z.string().min(1),
  date: z.date(),
  type: z.enum(["EXPENSE", "INCOME"]),
  paymentMethod: z.enum(["DEBIT", "CREDIT_CARD"]),
  cardId: z.string().optional(),
  installments: z.coerce.number().int().min(1).optional(),
}).refine((data) => {
    if (data.paymentMethod === 'CREDIT_CARD' && !data.cardId) return false;
    return true;
}, {
    message: "Selecione um cartão",
    path: ["cardId"],
});

export default function NewTransactionForm({ onSuccess }: { onSuccess?: () => void }) {
    const { addTransaction, loading } = useTransactions();
    const { categories } = useCategories();
    const { cards } = useCreditCards();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            description: "",
            amount: 0,
            date: new Date(),
            type: "EXPENSE",
            paymentMethod: "DEBIT",
            installments: 1,
        }
    });

    const paymentMethod = form.watch("paymentMethod");
    const type = form.watch("type");

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            let closingDay = undefined;
            if (values.paymentMethod === 'CREDIT_CARD' && values.cardId) {
                const card = cards.find(c => c.id === values.cardId);
                closingDay = card?.closingDay;
            }

            await addTransaction({
                description: values.description,
                amount: values.amount,
                categoryId: values.categoryId,
                date: values.date,
                type: values.type,
                paymentMethod: values.paymentMethod,
                cardId: values.cardId,
                installments: values.installments
            }, closingDay);

            form.reset();
            onSuccess?.();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                        <FormItem className="space-y-1">
                            <FormLabel>Tipo</FormLabel>
                            <FormControl>
                                <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="flex space-x-4"
                                >
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                        <FormControl>
                                            <RadioGroupItem value="EXPENSE" />
                                        </FormControl>
                                        <FormLabel className="font-normal text-red-300">Despesa</FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                        <FormControl>
                                            <RadioGroupItem value="INCOME" />
                                        </FormControl>
                                        <FormLabel className="font-normal text-emerald-300">Receita</FormLabel>
                                    </FormItem>
                                </RadioGroup>
                            </FormControl>
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Descrição</FormLabel>
                            <FormControl>
                                <Input placeholder="Ex: Almoço" {...field} className="bg-zinc-950 border-zinc-800" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Valor (R$)</FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.01" {...field} className="bg-zinc-950 border-zinc-800" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel className="mb-[6px]">Data</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full pl-3 text-left font-normal bg-zinc-950 border-zinc-800",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                            >
                                                {field.value ? (
                                                    format(field.value, "P", { locale: ptBR })
                                                ) : (
                                                    <span>Escolha uma data</span>
                                                )}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 bg-zinc-900 border-zinc-800" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            disabled={(date) =>
                                                date > new Date("2030-01-01") || date < new Date("1900-01-01")
                                            }
                                            initialFocus
                                            className="bg-zinc-900 text-zinc-100"
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Categoria</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger className="bg-zinc-950 border-zinc-800">
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-zinc-900 border-zinc-800">
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id} className="text-zinc-100 focus:bg-zinc-800">
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {type === 'EXPENSE' && (
                    <FormField
                        control={form.control}
                        name="paymentMethod"
                        render={({ field }) => (
                            <FormItem className="space-y-1">
                                <FormLabel>Forma de Pagamento</FormLabel>
                                <FormControl>
                                    <RadioGroup
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        className="flex space-x-4"
                                    >
                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                            <FormControl>
                                                <RadioGroupItem value="DEBIT" />
                                            </FormControl>
                                            <FormLabel className="font-normal text-zinc-300">À Vista / Débito</FormLabel>
                                        </FormItem>
                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                            <FormControl>
                                                <RadioGroupItem value="CREDIT_CARD" />
                                            </FormControl>
                                            <FormLabel className="font-normal text-zinc-300">Cartão de Crédito</FormLabel>
                                        </FormItem>
                                    </RadioGroup>
                                </FormControl>
                            </FormItem>
                        )}
                    />
                )}

                {paymentMethod === 'CREDIT_CARD' && type === 'EXPENSE' && (
                    <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                        <FormField
                            control={form.control}
                            name="cardId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Cartão</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="bg-zinc-950 border-zinc-800">
                                                <SelectValue placeholder="Selecione..." />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="bg-zinc-900 border-zinc-800">
                                            {cards.map((card) => (
                                                <SelectItem key={card.id} value={card.id} className="text-zinc-100 focus:bg-zinc-800">
                                                    {card.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="installments"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Parcelas</FormLabel>
                                    <FormControl>
                                        <Input type="number" min="1" max="24" {...field} className="bg-zinc-950 border-zinc-800" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                )}

                <Button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-semibold" disabled={loading}>
                    {loading ? "Salvando..." : "Adicionar Transação"}
                </Button>
            </form>
        </Form>
    );
}
