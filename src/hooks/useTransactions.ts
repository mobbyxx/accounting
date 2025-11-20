import { useState, useEffect } from 'react';
import type { Transaction, TransactionInput } from '../types';

const STORAGE_KEY = 'accounting_transactions';
const MIGRATION_KEY = 'accounting_migrated';
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const useTransactions = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [needsMigration, setNeedsMigration] = useState(false);

    // Lade Transaktionen von der API
    const loadTransactions = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/transactions`, {
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to load transactions');
            }

            const data = await response.json();
            setTransactions(data);
        } catch (err) {
            console.error('Error loading transactions:', err);
            setError('Fehler beim Laden der Buchungen');
        } finally {
            setLoading(false);
        }
    };

    // Initiales Laden & Migration-Check
    useEffect(() => {
        const checkMigration = () => {
            const migrated = localStorage.getItem(MIGRATION_KEY);
            const localData = localStorage.getItem(STORAGE_KEY);

            if (!migrated && localData) {
                try {
                    const parsed = JSON.parse(localData);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        setNeedsMigration(true);
                    }
                } catch (err) {
                    console.error('Error parsing localStorage:', err);
                }
            }
        };

        checkMigration();
        loadTransactions();
    }, []);

    // Migration von localStorage zu DB
    const migrateFromLocalStorage = async () => {
        const localData = localStorage.getItem(STORAGE_KEY);
        if (!localData) {
            return { success: false, message: 'Keine Daten gefunden' };
        }

        try {
            const transactions = JSON.parse(localData);

            const response = await fetch(`${API_BASE_URL}/api/sync`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ transactions }),
            });

            if (!response.ok) {
                throw new Error('Migration failed');
            }

            const result = await response.json();

            // Migration erfolgreich - localStorage leeren
            localStorage.setItem(MIGRATION_KEY, 'true');
            localStorage.removeItem(STORAGE_KEY);
            setNeedsMigration(false);

            // Transaktionen neu laden
            await loadTransactions();

            return result;
        } catch (err) {
            console.error('Error migrating data:', err);
            return { success: false, message: 'Migration fehlgeschlagen' };
        }
    };

    const addTransaction = async (input: TransactionInput) => {
        // Optimistisches UI-Update
        const tempId = `temp-${Date.now()}`;
        const tempTransaction: Transaction = {
            ...input,
            id: tempId,
        };
        setTransactions((prev) => [tempTransaction, ...prev]);

        try {
            const response = await fetch(`${API_BASE_URL}/api/transactions`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(input),
            });

            if (!response.ok) {
                throw new Error('Failed to create transaction');
            }

            const newTransaction = await response.json();

            // Ersetze temporäre Transaktion mit echter
            setTransactions((prev) =>
                prev.map((t) => (t.id === tempId ? newTransaction : t))
            );
        } catch (err) {
            console.error('Error creating transaction:', err);
            // Rollback bei Fehler
            setTransactions((prev) => prev.filter((t) => t.id !== tempId));
            setError('Fehler beim Speichern der Buchung');
            throw err;
        }
    };

    const deleteTransaction = async (id: string) => {
        // Optimistisches UI-Update
        const backup = transactions.find((t) => t.id === id);
        setTransactions((prev) => prev.filter((t) => t.id !== id));

        try {
            const response = await fetch(`${API_BASE_URL}/api/transactions/${id}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to delete transaction');
            }
        } catch (err) {
            console.error('Error deleting transaction:', err);
            // Rollback bei Fehler
            if (backup) {
                setTransactions((prev) => [backup, ...prev]);
            }
            setError('Fehler beim Löschen der Buchung');
            throw err;
        }
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
        loading,
        error,
        needsMigration,
        addTransaction,
        deleteTransaction,
        getSummary,
        migrateFromLocalStorage,
        refresh: loadTransactions,
    };
};
