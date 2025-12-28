"use client";

import { useState, useCallback } from "react";
import {
    collection,
    query,
    where,
    onSnapshot,
    addDoc,
    deleteDoc,
    doc,
    writeBatch,
    Timestamp,
    orderBy,
    increment
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Transaction, PaymentMethod, TransactionType } from "@/types";
import { addMonths, setDate, isAfter, getDate } from "date-fns";

export function useTransactions() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [transactions, setTransactions] = useState<Transaction[]>([]);

    // Helper: Get transactions for a specific month/year
    // For now, we return a simpler query or just all (limit to recent?)
    // Let's implement a listener that accepts a month/year range filter.
    // Actually, hooks usually return data. 
    // Let's make a function 'subscribeToMonth' instead of auto-loading everything.

    // Function to subscribe to transactions (can be used by Extrato)
    const subscribeToAllTransactions = useCallback(() => {
        if (!user?.email) return () => { };

        const q = query(
            collection(db, "transactions"),
            where("ownerEmail", "==", user.email),
            orderBy("date", "desc")
        );

        return onSnapshot(q, (snapshot) => {
            const txs: Transaction[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data() as Omit<Transaction, "id" | "date" | "originalDate"> & { date: Timestamp, originalDate?: Timestamp };
                txs.push({
                    id: doc.id,
                    ...data,
                    date: data.date.toDate(),
                    originalDate: data.originalDate?.toDate()
                } as Transaction);
            });
            setTransactions(txs);
        });
    }, [user]);

    const addTransaction = async (
        data: Omit<Transaction, "id" | "ownerEmail" | "date" | "installments"> & {
            date: Date,
            installments?: number
        },
        cardClosingDay?: number
    ) => {
        if (!user?.email) return;
        setLoading(true);

        try {
            const batch = writeBatch(db);
            const collectionRef = collection(db, "transactions");

            // Base transaction object
            const baseTx = {
                description: data.description,
                amount: data.amount,
                type: data.type,
                paymentMethod: data.paymentMethod,
                categoryId: data.categoryId,
                cardId: data.cardId || null,
                ownerEmail: user.email,
            };

            if (data.paymentMethod === 'CREDIT_CARD' && data.installments && data.installments > 1) {
                // Installment Logic
                const installmentAmount = data.amount / data.installments;
                const groupId = crypto.randomUUID();

                // Determine start date based on closing day
                let startDate = data.date;
                if (cardClosingDay) {
                    const dayOfMonth = getDate(data.date);
                    if (dayOfMonth >= cardClosingDay) {
                        // If purchase is after closing, first installment is next month
                        startDate = addMonths(startDate, 1);
                    }
                }
                // Actually, if it's credit card, standard logic is:
                // Buying today. If bill is open, goes to this month. If closed, next month.
                // The "Date" of the transaction record should probably reflect the "Competence Month" 
                // so queries for "January" show bills due in January?
                // Yes, usually we want to see "What do I pay in January".
                // So we shift the date to the 1st of the target payment month.

                for (let i = 0; i < data.installments; i++) {
                    const outputDate = addMonths(startDate, i);
                    const docRef = doc(collectionRef);
                    batch.set(docRef, {
                        ...baseTx,
                        amount: installmentAmount, // Split amount
                        date: Timestamp.fromDate(outputDate), // Future date
                        installments: {
                            total: data.installments,
                            current: i + 1,
                            groupId
                        },
                        originalDate: Timestamp.fromDate(data.date) // Keep track of purchase date
                    });
                }
            } else {
                // Single transaction (Cash or 1x Credit)
                // If 1x Credit, it still respects closing day for "Viewing" purposes?
                // Yes, if I buy on 20th but card closed on 15th, I pay next month.
                let finalDate = data.date;

                if (data.paymentMethod === 'CREDIT_CARD' && cardClosingDay) {
                    const dayOfMonth = getDate(data.date);
                    if (dayOfMonth >= cardClosingDay) {
                        finalDate = addMonths(finalDate, 1);
                    }
                }

                await addDoc(collectionRef, {
                    ...baseTx,
                    date: Timestamp.fromDate(finalDate),
                    originalDate: Timestamp.fromDate(data.date)
                });
            }

            if (data.paymentMethod === 'CREDIT_CARD' && data.cardId) {
                const cardRef = doc(db, "credit_cards", data.cardId);
                // Subtract the FULL amount from the available limit immediately
                batch.update(cardRef, {
                    availableLimit: increment(-data.amount)
                });
            }

            await batch.commit();
        } catch (error) {
            console.error("Error adding transaction", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const deleteTransaction = async (id: string) => {
        if (!user?.email) return;

        try {
            const docRef = doc(db, "transactions", id);
            await deleteDoc(docRef);
        } catch (error: any) {
            console.error("Error deleting transaction", error);
            if (error.code === 'permission-denied') {
                alert("Permissão negada. Verifique se essa transação pertence a você.");
            } else {
                alert("Erro ao excluir transação.");
            }
            throw error;
        }
    };

    return { transactions, subscribeToAllTransactions, addTransaction, deleteTransaction, loading };
}
