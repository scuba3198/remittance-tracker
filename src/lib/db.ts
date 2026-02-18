import Dexie, { type EntityTable } from 'dexie';

// Define the shape of the record as stored in IndexedDB
// We store raw primitives here, not Domain Types.
// Domain Types are for Logic, Raw Types are for Storage/Transport.
export interface TransactionRecord {
    id: string; // UUID
    date: string; // YYYY-MM-DD
    sourceAmount: number;
    targetAmount: number;
    exchangeRate: number;
    note?: string;
    createdAt: number; // For sorting/audit if needed
}

const db = new Dexie('RemittanceDB') as Dexie & {
    transactions: EntityTable<
        TransactionRecord,
        'id' // primary key "id" (for the typings only)
    >;
};

// Schema Definition
db.version(1).stores({
    transactions: 'id, date, createdAt' // Primary key and indexed props
});

export { db };

// --- Backup & Restore Utilities ---

export const exportDatabase = async (): Promise<string> => {
    const allTransactions = await db.transactions.toArray();
    const backup = {
        version: 1,
        timestamp: new Date().toISOString(),
        transactions: allTransactions
    };
    return JSON.stringify(backup, null, 2);
};

export const importDatabase = async (jsonString: string): Promise<{ added: number, updated: number, errors: string[] }> => {
    let data;
    try {
        data = JSON.parse(jsonString);
    } catch (e) {
        return { added: 0, updated: 0, errors: ['Invalid JSON format'] };
    }

    if (!data.transactions || !Array.isArray(data.transactions)) {
        return { added: 0, updated: 0, errors: ['Invalid backup format: missing transactions array'] };
    }

    let added = 0;
    let updated = 0;
    const errors: string[] = [];

    await db.transaction('rw', db.transactions, async () => {
        for (const record of data.transactions) {
            // Basic schema validation for record
            if (!record.id || typeof record.sourceAmount !== 'number') {
                errors.push(`Skipping invalid record: ${record.id ?? 'unknown'}`);
                continue;
            }

            // Check if exists
            const exists = await db.transactions.get(record.id);
            if (exists) {
                await db.transactions.put(record);
                updated++;
            } else {
                await db.transactions.add(record);
                added++;
            }
        }
    });

    return { added, updated, errors };
};
