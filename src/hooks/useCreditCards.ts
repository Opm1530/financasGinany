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
    updateDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { CreditCard } from "@/types";

export function useCreditCards() {
    const { user } = useAuth();
    const [cards, setCards] = useState<CreditCard[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.email) return;

        const q = query(
            collection(db, "credit_cards"),
            where("ownerEmail", "==", user.email)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const c: CreditCard[] = [];
            snapshot.forEach((doc) => {
                c.push({ id: doc.id, ...doc.data() } as CreditCard);
            });
            c.sort((a, b) => a.name.localeCompare(b.name));
            setCards(c);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const addCard = async (data: Omit<CreditCard, "id" | "ownerEmail" | "availableLimit">) => {
        if (!user?.email) return;
        await addDoc(collection(db, "credit_cards"), {
            ...data,
            availableLimit: data.limit, // Initialized with total limit
            ownerEmail: user.email,
        });
    };

    const updateCard = async (id: string, data: Partial<Omit<CreditCard, "id" | "ownerEmail">>) => {
        const ref = doc(db, "credit_cards", id);
        await updateDoc(ref, data);
    };

    const deleteCard = async (id: string) => {
        await deleteDoc(doc(db, "credit_cards", id));
    };

    return { cards, loading, addCard, updateCard, deleteCard };
}
