export interface Category {
    code: string;
    label: string;
    type: 'income' | 'expense';
}

export const CATEGORIES: Category[] = [
    // Einnahmen (Income)
    { code: '8100', label: 'Steuerfreie Umsätze § 4 Nr. 8 ff. UStG', type: 'income' },
    { code: '8195', label: 'Erlöse als Kleinunternehmer i.S.d. § 19 UStG', type: 'income' },
    { code: '8200', label: 'Erlöse', type: 'income' },
    { code: '8300', label: 'Erlöse 7% USt', type: 'income' },
    { code: '8400', label: 'Erlöse 19% USt', type: 'income' },
    { code: '8519', label: 'Provisionserlöse 19% USt', type: 'income' },
    { code: '8611', label: 'Verrechnete sonstige Sachbezüge 19% USt', type: 'income' },
    { code: '8920', label: 'Entnahme durch den Unternehmer für Zwecke außerhalb des Unternehmens (Waren) 19% USt', type: 'income' },

    // Ausgaben (Expenses)
    { code: '0027', label: 'EDV-Software', type: 'expense' },
    { code: '0480', label: 'Geringwertige Wirtschaftsgüter (GWG) bis 800 €', type: 'expense' },
    { code: '0490', label: 'Sonstige Betriebs- und Geschäftsausstattung', type: 'expense' },
    { code: '3123', label: 'Sonstige Leistungen eines im anderen EU-Land ansässigen Unternehmers 19% Vorsteuer und 19% USt', type: 'expense' },
    { code: '3400', label: 'Wareneingang 19% Vorsteuer', type: 'expense' },
    { code: '4210', label: 'Miete (unbewegliche Wirtschaftsgüter)', type: 'expense' },
    { code: '4360', label: 'Versicherungen', type: 'expense' },
    { code: '4380', label: 'Beiträge', type: 'expense' },
    { code: '4500', label: 'Fahrzeugkosten', type: 'expense' },
    { code: '4610', label: 'Werbekosten', type: 'expense' },
    { code: '4640', label: 'Repräsentationskosten', type: 'expense' },
    { code: '4660', label: 'Reisekosten Arbeitnehmer', type: 'expense' },
    { code: '4670', label: 'Reisekosten Unternehmer', type: 'expense' },
    { code: '4900', label: 'Sonstige betriebliche Aufwendungen', type: 'expense' },
    { code: '4910', label: 'Porto', type: 'expense' },
    { code: '4920', label: 'Telefon', type: 'expense' },
    { code: '4925', label: 'Telefax und Internetkosten', type: 'expense' },
    { code: '4930', label: 'Bürobedarf', type: 'expense' },
    { code: '4940', label: 'Zeitschriften, Bücher', type: 'expense' },
    { code: '4950', label: 'Rechts- und Beratungskosten', type: 'expense' },
    { code: '4970', label: 'Nebenkosten des Geldverkehrs', type: 'expense' },
    { code: '4980', label: 'Betriebsbedarf', type: 'expense' },
];
