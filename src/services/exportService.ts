import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Transaction } from '../types';

/**
 * Export Service
 * Provides functions to export data to CSV, Excel, and PDF formats
 */

// ========================================
// CSV Export
// ========================================

/**
 * Exports transactions to CSV format
 */
export const exportTransactionsToCSV = (transactions: Transaction[], filename: string = 'transaktionen.csv') => {
    // CSV headers
    const headers = ['Datum', 'Beschreibung', 'Kategorie', 'Typ', 'MwSt.', 'Betrag'];

    // Convert transactions to CSV rows
    const rows = transactions.map(t => [
        new Date(t.date).toLocaleDateString('de-DE'),
        t.description,
        t.category,
        t.type === 'income' ? 'Einnahme' : 'Ausgabe',
        `${t.vatRate}%`,
        formatCurrencyValue(t.amount)
    ]);

    // Combine headers and rows
    const csvContent = [
        headers.join(';'),
        ...rows.map(row => row.join(';'))
    ].join('\n');

    // Add BOM for proper Excel UTF-8 handling
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    downloadFile(blob, filename);
};

/**
 * Exports EÜR summary to CSV format
 */
export const exportEURToCSV = (
    incomeByCategory: Array<{ name: string; value: number }>,
    expensesByCategory: Array<{ name: string; value: number }>,
    summary: { income: number; expenses: number; profit: number; estimatedIncomeTax: number },
    filename: string = 'euer_bericht.csv'
) => {
    const sections: string[] = [];

    // Summary section
    sections.push('ZUSAMMENFASSUNG');
    sections.push('Betriebseinnahmen;' + formatCurrencyValue(summary.income));
    sections.push('Betriebsausgaben;' + formatCurrencyValue(summary.expenses));
    sections.push('Gewinn;' + formatCurrencyValue(summary.profit));
    sections.push('Geschätzte ESt;' + formatCurrencyValue(summary.estimatedIncomeTax));
    sections.push('');

    // Income section
    sections.push('EINNAHMEN NACH KATEGORIE');
    sections.push('Kategorie;Betrag');
    incomeByCategory.forEach(item => {
        sections.push(`${item.name};${formatCurrencyValue(item.value)}`);
    });
    sections.push('');

    // Expenses section
    sections.push('AUSGABEN NACH KATEGORIE');
    sections.push('Kategorie;Betrag');
    expensesByCategory.forEach(item => {
        sections.push(`${item.name};${formatCurrencyValue(item.value)}`);
    });

    const csvContent = sections.join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    downloadFile(blob, filename);
};

// ========================================
// Excel Export
// ========================================

/**
 * Exports transactions to Excel format
 */
export const exportTransactionsToExcel = (transactions: Transaction[], filename: string = 'transaktionen.xlsx') => {
    // Prepare data
    const data = transactions.map(t => ({
        'Datum': new Date(t.date).toLocaleDateString('de-DE'),
        'Beschreibung': t.description,
        'Kategorie': t.category,
        'Typ': t.type === 'income' ? 'Einnahme' : 'Ausgabe',
        'MwSt.': `${t.vatRate}%`,
        'Betrag': formatCurrencyValue(t.amount)
    }));

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();

    // Set column widths
    worksheet['!cols'] = [
        { wch: 12 }, // Datum
        { wch: 30 }, // Beschreibung
        { wch: 25 }, // Kategorie
        { wch: 12 }, // Typ
        { wch: 10 }, // MwSt.
        { wch: 15 }  // Betrag
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transaktionen');

    // Write file
    XLSX.writeFile(workbook, filename);
};

/**
 * Exports EÜR report to Excel format
 */
export const exportEURToExcel = (
    incomeByCategory: Array<{ name: string; value: number }>,
    expensesByCategory: Array<{ name: string; value: number }>,
    summary: { income: number; expenses: number; profit: number; estimatedIncomeTax: number },
    filename: string = 'euer_bericht.xlsx'
) => {
    const workbook = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
        ['Einnahmenüberschussrechnung'],
        [''],
        ['Kategorie', 'Betrag'],
        ['Betriebseinnahmen', formatCurrencyValue(summary.income)],
        ['Betriebsausgaben', formatCurrencyValue(summary.expenses)],
        ['Gewinn', formatCurrencyValue(summary.profit)],
        ['Geschätzte ESt (2025)', formatCurrencyValue(summary.estimatedIncomeTax)]
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    summarySheet['!cols'] = [{ wch: 25 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Zusammenfassung');

    // Income sheet
    const incomeData = [
        ['Einnahmen nach Kategorie'],
        [''],
        ['Kategorie', 'Betrag'],
        ...incomeByCategory.map(item => [item.name, formatCurrencyValue(item.value)]),
        [''],
        ['Gesamt', formatCurrencyValue(summary.income)]
    ];
    const incomeSheet = XLSX.utils.aoa_to_sheet(incomeData);
    incomeSheet['!cols'] = [{ wch: 30 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(workbook, incomeSheet, 'Einnahmen');

    // Expenses sheet
    const expensesData = [
        ['Ausgaben nach Kategorie'],
        [''],
        ['Kategorie', 'Betrag'],
        ...expensesByCategory.map(item => [item.name, formatCurrencyValue(item.value)]),
        [''],
        ['Gesamt', formatCurrencyValue(summary.expenses)]
    ];
    const expensesSheet = XLSX.utils.aoa_to_sheet(expensesData);
    expensesSheet['!cols'] = [{ wch: 30 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(workbook, expensesSheet, 'Ausgaben');

    // Write file
    XLSX.writeFile(workbook, filename);
};

// ========================================
// PDF Export
// ========================================

/**
 * Exports transactions to PDF format
 */
export const exportTransactionsToPDF = (
    transactions: Transaction[],
    summary: { income: number; expenses: number; profit: number; estimatedIncomeTax: number },
    filename: string = 'transaktionen.pdf'
) => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.text('Transaktionen', 14, 20);

    // Summary
    doc.setFontSize(11);
    doc.text(`Datum: ${new Date().toLocaleDateString('de-DE')}`, 14, 30);

    // Summary boxes
    const summaryY = 40;
    doc.setFontSize(10);
    doc.text(`Einnahmen: ${formatCurrency(summary.income)}`, 14, summaryY);
    doc.text(`Ausgaben: ${formatCurrency(summary.expenses)}`, 70, summaryY);
    doc.text(`Gewinn: ${formatCurrency(summary.profit)}`, 130, summaryY);

    // Table
    const tableData = transactions.map(t => [
        new Date(t.date).toLocaleDateString('de-DE'),
        t.description,
        t.category,
        t.type === 'income' ? 'Einnahme' : 'Ausgabe',
        `${t.vatRate}%`,
        formatCurrency(t.amount)
    ]);

    autoTable(doc, {
        startY: summaryY + 10,
        head: [['Datum', 'Beschreibung', 'Kategorie', 'Typ', 'MwSt.', 'Betrag']],
        body: tableData,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [99, 102, 241] },
        columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 50 },
            2: { cellWidth: 40 },
            3: { cellWidth: 25 },
            4: { cellWidth: 15 },
            5: { cellWidth: 25, halign: 'right' }
        },
        theme: 'grid'
    });

    // Save
    doc.save(filename);
};

/**
 * Exports EÜR report to PDF format
 */
export const exportEURToPDF = (
    incomeByCategory: Array<{ name: string; value: number }>,
    expensesByCategory: Array<{ name: string; value: number }>,
    summary: { income: number; expenses: number; profit: number; estimatedIncomeTax: number },
    filename: string = 'euer_bericht.pdf'
) => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(20);
    doc.text('Einnahmenüberschussrechnung', 14, 20);

    doc.setFontSize(11);
    doc.text(`Erstellt am: ${new Date().toLocaleDateString('de-DE')}`, 14, 30);

    // Summary section
    doc.setFontSize(14);
    doc.text('Zusammenfassung', 14, 45);

    const summaryData = [
        ['Betriebseinnahmen', formatCurrency(summary.income)],
        ['Betriebsausgaben', formatCurrency(summary.expenses)],
        ['Gewinn', formatCurrency(summary.profit)],
        ['Geschätzte ESt (2025)', formatCurrency(summary.estimatedIncomeTax)]
    ];

    autoTable(doc, {
        startY: 50,
        body: summaryData,
        styles: { fontSize: 11 },
        columnStyles: {
            0: { cellWidth: 100, fontStyle: 'bold' },
            1: { cellWidth: 60, halign: 'right' }
        },
        theme: 'plain'
    });

    // Income section
    let currentY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.text('Einnahmen nach Kategorie', 14, currentY);

    const incomeData = incomeByCategory.map(item => [
        item.name,
        formatCurrency(item.value)
    ]);

    autoTable(doc, {
        startY: currentY + 5,
        head: [['Kategorie', 'Betrag']],
        body: incomeData,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [34, 197, 94] },
        columnStyles: {
            0: { cellWidth: 120 },
            1: { cellWidth: 50, halign: 'right' }
        },
        theme: 'grid'
    });

    // Expenses section
    currentY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.text('Ausgaben nach Kategorie', 14, currentY);

    const expensesData = expensesByCategory.map(item => [
        item.name,
        formatCurrency(item.value)
    ]);

    autoTable(doc, {
        startY: currentY + 5,
        head: [['Kategorie', 'Betrag']],
        body: expensesData,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [239, 68, 68] },
        columnStyles: {
            0: { cellWidth: 120 },
            1: { cellWidth: 50, halign: 'right' }
        },
        theme: 'grid'
    });

    // Save
    doc.save(filename);
};

// ========================================
// Helper Functions
// ========================================

/**
 * Formats a number as currency string for display
 */
const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
};

/**
 * Formats a number as currency value for CSV/Excel (numeric string with 2 decimals)
 */
const formatCurrencyValue = (amount: number): string => {
    return amount.toFixed(2).replace('.', ',');
};

/**
 * Triggers file download
 */
const downloadFile = (blob: Blob, filename: string) => {
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
