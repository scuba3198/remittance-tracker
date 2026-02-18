import Dexie, { type EntityTable } from "dexie";

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

const db = new Dexie("RemittanceDB") as Dexie & {
	transactions: EntityTable<
		TransactionRecord,
		"id" // primary key "id" (for the typings only)
	>;
};

// Schema Definition
db.version(1).stores({
	transactions: "id, date, createdAt", // Primary key and indexed props
});

export { db };

// --- Backup & Restore Utilities ---

export const exportDatabase = async (): Promise<string> => {
	const allTransactions = await db.transactions.toArray();
	const backup = {
		version: 1,
		timestamp: new Date().toISOString(),
		transactions: allTransactions,
	};
	return JSON.stringify(backup, null, 2);
};

import { z } from "zod";

// define Schema for validation
const BackupSchema = z.object({
	version: z.number(),
	timestamp: z.string(),
	transactions: z.array(
		z.object({
			id: z.string(),
			date: z.string(),
			sourceAmount: z.number(),
			targetAmount: z.number(),
			exchangeRate: z.number(),
			note: z.string().optional(),
			createdAt: z.number(),
		}),
	),
});

export const importDatabase = async (
	jsonString: string,
): Promise<{ added: number; updated: number; errors: string[] }> => {
	let parsed: unknown;
	try {
		parsed = JSON.parse(jsonString);
	} catch {
		return { added: 0, updated: 0, errors: ["Invalid JSON format"] };
	}

	const validation = BackupSchema.safeParse(parsed);
	if (!validation.success) {
		return {
			added: 0,
			updated: 0,
			errors: [`Invalid backup format: ${validation.error.message}`],
		};
	}

	const { transactions } = validation.data;
	let added = 0;
	let updated = 0;
	const errors: string[] = [];

	await db.transaction("rw", db.transactions, async () => {
		for (const record of transactions) {
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
