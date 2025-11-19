import Tesseract from 'tesseract.js';

export const parseReceipt = async (file: File): Promise<{ date?: string; amount?: number; text: string }> => {
    try {
        const result = await Tesseract.recognize(file, 'deu', {
            logger: (m) => console.log(m),
        });

        const text = result.data.text;
        console.log('OCR Result:', text);

        // Simple regex for date (DD.MM.YYYY or YYYY-MM-DD)
        const dateRegex = /(\d{2}\.\d{2}\.\d{4})|(\d{4}-\d{2}-\d{2})/;
        const dateMatch = text.match(dateRegex);
        let date: string | undefined;

        if (dateMatch) {
            const dateStr = dateMatch[0];
            if (dateStr.includes('.')) {
                const [day, month, year] = dateStr.split('.');
                date = `${year}-${month}-${day}`;
            } else {
                date = dateStr;
            }
        }

        // Simple regex for amount (looking for currency symbols or just numbers at the end of lines)
        // This is very basic and might need refinement.
        // Matches: 12,34 or 12.34 with optional € or EUR
        const amountRegex = /(\d+[.,]\d{2})\s*(?:€|EUR)?/gi;
        const amounts = text.match(amountRegex);

        let maxAmount = 0;
        if (amounts) {
            // Find the largest number, assuming it's the total
            const parsedAmounts = amounts.map(a => {
                const clean = a.replace(/[^\d.,]/g, '').replace(',', '.');
                return parseFloat(clean);
            }).filter(n => !isNaN(n));

            if (parsedAmounts.length > 0) {
                maxAmount = Math.max(...parsedAmounts);
            }
        }

        return {
            date,
            amount: maxAmount > 0 ? maxAmount : undefined,
            text
        };
    } catch (error) {
        console.error('OCR Error:', error);
        throw error;
    }
};
