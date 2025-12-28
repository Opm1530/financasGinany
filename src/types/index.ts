export interface Category {
    id: string;
    name: string;
    budgetLimit: number; // Stored as number (e.g., 1000.00)
    ownerEmail: string;
}

export interface CreditCard {
    id: string;
    name: string;
    limit: number;
    availableLimit: number;
    closingDay: number;
    dueDay: number;
    ownerEmail: string;
}

export type TransactionType = 'INCOME' | 'EXPENSE';
export type PaymentMethod = 'DEBIT' | 'CREDIT_CARD';

export interface Transaction {
    id: string;
    description: string;
    amount: number;
    date: Date; // Timestamp in Firestore
    type: TransactionType;
    paymentMethod: PaymentMethod;
    categoryId: string;
    cardId?: string; // If CREDIT_CARD
    installments?: {
        total: number;
        current: number;
        groupId: string;
    };
    ownerEmail: string;
}

export interface Dividend {
    id: string;
    ticker: string;
    amount: number;
    date: Date;
    type: string; // 'DIVIDEND', 'JCP', etc.
    ownerEmail: string;
}

export interface Investment {
    id: string;
    name: string;
    ticker: string; // e.g. PETR4
    type: string; // 'stock', 'fii', 'fixed', 'crypto'
    quantity: number;
    avgPrice: number; // Preço Médio
    currentPrice?: number; // Fetched from API (not necessarily stored in DB, but useful in UI)
    date: Date;
    ownerEmail: string;
}
