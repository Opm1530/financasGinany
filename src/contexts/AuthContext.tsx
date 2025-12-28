"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
    User,
    signInWithPopup,
    signOut as firebaseSignOut,
    onAuthStateChanged
} from "firebase/auth";
import { auth, googleProvider, db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signIn: () => Promise<void>;
    signOut: () => Promise<void>;
    isAllowed: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    signIn: async () => { },
    signOut: async () => { },
    isAllowed: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAllowed, setIsAllowed] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setLoading(true);
            if (currentUser) {
                // Check if email is allowed
                // Strategy: We can keep a collection 'allowed_users' or just check a specific logic.
                // For this app, we'll check if a user profile exists OR if it fits a hardcoded list initially,
                // but the plan said "Email Allowlist".

                // Let's implement a check against a Firestore collection 'users' to see if they are active/allowed,
                // OR allow the VERY FIRST user to register automatically as admin? 
                // User asked for "specific email checks". 
                // We'll check the 'users' collection. If document exists, they are allowed.
                // If not, we block them. (Ideally we need a way to seed the first user).

                // TEMP: Allow all for development OR check hardcoded env var?
                // Let's use Firestore.
                const userRef = doc(db, "users", currentUser.email!);
                const userSnap = await getDoc(userRef);

                if (userSnap.exists()) {
                    setUser(currentUser);
                    setIsAllowed(true);
                } else {
                    // Provide a way to override/bootstrap? 
                    // For now, we can perhaps auto-create if it matches a hardcoded 'ADMIN_EMAIL' in env?
                    if (currentUser.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
                        await setDoc(userRef, {
                            email: currentUser.email,
                            role: 'admin',
                            createdAt: new Date()
                        });
                        setUser(currentUser);
                        setIsAllowed(true);
                    } else {
                        // Not allowed
                        console.warn("User not in allowlist:", currentUser.email);
                        setUser(currentUser); // Set user anyway so we can show "Access Denied" page
                        setIsAllowed(false);
                    }
                }
            } else {
                setUser(null);
                setIsAllowed(false);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signIn = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error("Error signing in", error);
        }
    };

    const signOut = async () => {
        try {
            await firebaseSignOut(auth);
            router.push("/login");
        } catch (error) {
            console.error("Error signing out", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, signIn, signOut, isAllowed }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
