export type TransactionType = 'income' | 'expense';

export interface Transaction {
    id: string;
    date: string;
    description: string;
    amount: number;
    type: TransactionType;
    category: string;
    vatRate: number;
    attachmentUrl?: string;
}

export interface TransactionInput {
    date: string;
    description: string;
    amount: number;
    type: TransactionType;
    category: string;
    vatRate: number;
    attachmentUrl?: string;
}
