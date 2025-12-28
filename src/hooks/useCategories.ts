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
import { Category } from "@/types";

export function useCategories() {
    const { user } = useAuth();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.email) return;

        const q = query(
            collection(db, "categories"),
            where("ownerEmail", "==", user.email)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const cats: Category[] = [];
            snapshot.forEach((doc) => {
                cats.push({ id: doc.id, ...doc.data() } as Category);
            });
            // Sort alphabetically? or by budget? Let's sort by name for now
            cats.sort((a, b) => a.name.localeCompare(b.name));
            setCategories(cats);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const addCategory = async (name: string, budgetLimit: number) => {
        if (!user?.email) return;
        await addDoc(collection(db, "categories"), {
            name,
            budgetLimit,
            ownerEmail: user.email,
        });
    };

    const updateCategory = async (id: string, data: Partial<Omit<Category, "id" | "ownerEmail">>) => {
        const ref = doc(db, "categories", id);
        await updateDoc(ref, data);
    };

    const deleteCategory = async (id: string) => {
        await deleteDoc(doc(db, "categories", id));
    };

    return { categories, loading, addCategory, updateCategory, deleteCategory };
}
