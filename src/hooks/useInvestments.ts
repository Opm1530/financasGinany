"use client";

import { useState, useEffect } from "react";
import {
    collection,
    query,
    where,
    onSnapshot,
    addDoc,
    deleteDoc,
    doc,
    updateDoc,
    Timestamp,
    orderBy
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Investment, Dividend } from "@/types";

export function useInvestments() {
    const { user } = useAuth();
    const [investments, setInvestments] = useState<Investment[]>([]);
    const [dividends, setDividends] = useState<Dividend[]>([]);
    const [loading, setLoading] = useState(true);

    // Subscribe to Investments
    useEffect(() => {
        if (!user?.email) {
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, "investments"),
            where("ownerEmail", "==", user.email)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items: Investment[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                // Ensure date is handled correctly
                items.push({
                    id: doc.id,
                    ...data,
                    date: data.date?.toDate() || new Date(),
                } as Investment);
            });
            // Sort by ticker name
            items.sort((a, b) => a.ticker.localeCompare(b.ticker));
            setInvestments(items);
            // Don't set loading false here immediately if we wait for dividends, 
            // but for responsiveness separate loading states might be better or just one 'global' loading.
            // Let's keep it simple.
        });

        return () => unsubscribe();
    }, [user]);

    // Subscribe to Dividends
    useEffect(() => {
        if (!user?.email) {
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, "dividends"),
            where("ownerEmail", "==", user.email),
            orderBy("date", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items: Dividend[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                items.push({
                    id: doc.id,
                    ...data,
                    date: data.date?.toDate() || new Date(),
                } as Dividend);
            });
            setDividends(items);
            setLoading(false); // Assume loaded when both (or at least one) returns
        });

        return () => unsubscribe();
    }, [user]);

    const addInvestment = async (data: Omit<Investment, "id" | "ownerEmail">) => {
        if (!user?.email) return;

        await addDoc(collection(db, "investments"), {
            ...data,
            ownerEmail: user.email,
            date: Timestamp.fromDate(data.date)
        });
    };

    const updateInvestment = async (id: string, data: Partial<Omit<Investment, "id" | "ownerEmail">>) => {
        const ref = doc(db, "investments", id);
        const updateData: any = { ...data };
        if (data.date) {
            updateData.date = Timestamp.fromDate(data.date);
        }
        await updateDoc(ref, updateData);
    };

    const deleteInvestment = async (id: string) => {
        await deleteDoc(doc(db, "investments", id));
    };

    const addDividend = async (data: Omit<Dividend, "id" | "ownerEmail">) => {
        if (!user?.email) return;
        try {
            await addDoc(collection(db, "dividends"), {
                ...data,
                ownerEmail: user.email,
                date: Timestamp.fromDate(data.date), // Store as Timestamp
            });
        } catch (error) {
            console.error("Error adding dividend", error);
            throw error;
        }
    };

    const deleteDividend = async (id: string) => {
        await deleteDoc(doc(db, "dividends", id));
    };

    return { investments, dividends, loading, addInvestment, updateInvestment, deleteInvestment, addDividend, deleteDividend };
}
