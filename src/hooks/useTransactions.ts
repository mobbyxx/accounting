import { useState, useEffect } from 'react';
import type { Transaction, TransactionInput } from '../types';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'accounting_transactions';

export const useTransactions = () => {
    const [transactions, setTransactions] = useState<Transaction[]>(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    }, [transactions]);

    const addTransaction = (input: TransactionInput) => {
        const newTransaction: Transaction = {
            ...input,
            id: uuidv4(),
        };
        setTransactions((prev) => [newTransaction, ...prev]);
    };

    const deleteTransaction = (id: string) => {
        setTransactions((prev) => prev.filter((t) => t.id !== id));
    };

    const calculateIncomeTax = (zvE: number): number => {
        // § 32a EStG 2025
        const x = Math.floor(zvE);

        if (x <= 12096) {
            return 0;
        } else if (x <= 17443) {
            const y = (x - 12096) / 10000;
            return Math.floor((932.30 * y + 1400) * y);
        } else if (x <= 68480) {
            const z = (x - 17443) / 10000;
            return Math.floor((176.64 * z + 2397) * z + 1015.13);
        } else if (x <= 277825) {
            return Math.floor(0.42 * x - 10911.92);
        } else {
            return Math.floor(0.45 * x - 19246.67);
        }
    };

    const getSummary = () => {
        const income = transactions
            .filter((t) => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const expenses = transactions
            .filter((t) => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const profit = income - expenses;

        // Estimate Income Tax based on profit (simplified, assuming profit == zvE)
        // In reality, zvE would deduct Sonderausgaben, etc.
        const estimatedIncomeTax = profit > 0 ? calculateIncomeTax(profit) : 0;

        return {
            income,
            expenses,
            profit,
            estimatedIncomeTax
        };
    };

    return {
        transactions,
        addTransaction,
        deleteTransaction,
        getSummary,
    };
};
