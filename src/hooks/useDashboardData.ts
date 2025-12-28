"use client";

import { useState, useEffect } from "react";
import {
    collection,
    query,
    where,
    onSnapshot,
    Timestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useCategories } from "@/hooks/useCategories";
import { Transaction, Category } from "@/types";
import { startOfMonth, endOfMonth } from "date-fns";

export interface CategorySummary extends Category {
    spent: number;
    transactions: Transaction[];
}

export function useDashboardData(selectedDate: Date) {
    const { user } = useAuth();
    const { categories, loading: catsLoading } = useCategories();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [summary, setSummary] = useState<{
        totalIncome: number;
        totalExpense: number;
        categorySummaries: CategorySummary[];
    }>({ totalIncome: 0, totalExpense: 0, categorySummaries: [] });
    const [loading, setLoading] = useState(true);

    // ... (previous state)
    const [previousBalance, setPreviousBalance] = useState(0);

    // Fetch transactions for selected month
    useEffect(() => {
        if (!user?.email) return;

        const start = startOfMonth(selectedDate);
        const end = endOfMonth(selectedDate);

        // 1. Current Month Query
        const qCurrent = query(
            collection(db, "transactions"),
            where("ownerEmail", "==", user.email),
            where("date", ">=", Timestamp.fromDate(start)),
            where("date", "<=", Timestamp.fromDate(end))
        );

        const unsubCurrent = onSnapshot(qCurrent, (snapshot) => {
            const txs: Transaction[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                txs.push({
                    id: doc.id,
                    ...data,
                    date: data.date.toDate()
                } as Transaction);
            });
            setTransactions(txs);
            setLoading(false);
        });

        // 2. Previous History Query (To calculate carryover)
        // Optimization: We could aggregate this server-side or only fetch once, 
        // but for now let's just fetch simplified data or all past docs.
        // Assuming user data < 5000 docs, this is okay.
        const qPast = query(
            collection(db, "transactions"),
            where("ownerEmail", "==", user.email),
            where("date", "<", Timestamp.fromDate(start))
        );

        // We don't necessarily need real-time updates for DEEP past as urgently, but consistency is key.
        const unsubPast = onSnapshot(qPast, (snapshot) => {
            let balance = 0;
            snapshot.forEach((doc) => {
                const data = doc.data();
                const amt = data.amount || 0;
                if (data.type === 'INCOME') balance += amt;
                else balance -= amt;
            });
            setPreviousBalance(balance);
        });

        return () => {
            unsubCurrent();
            unsubPast();
        };
    }, [user, selectedDate]);

    // Aggregate Data
    useEffect(() => {
        if (catsLoading) return; // Wait for categories

        let totalIncome = 0;
        let totalExpense = 0;
        const catMap = new Map<string, CategorySummary>();

        // Initialize Categories
        categories.forEach(c => {
            catMap.set(c.id, { ...c, spent: 0, transactions: [] });
        });

        transactions.forEach(tx => {
            if (tx.type === 'INCOME') {
                totalIncome += tx.amount;
            } else {
                totalExpense += tx.amount;

                // Add to category
                const cat = catMap.get(tx.categoryId);
                if (cat) {
                    cat.spent += tx.amount;
                    cat.transactions.push(tx);
                }
            }
        });

        setSummary({
            totalIncome,
            totalExpense,
            categorySummaries: Array.from(catMap.values()).sort((a, b) => b.spent - a.spent)
        });

    }, [transactions, categories, catsLoading]);

    return {
        ...summary,
        previousBalance,
        balance: previousBalance + summary.totalIncome - summary.totalExpense, // Monthly Closing Balance
        loading: loading || catsLoading,
        transactions
    };
}
