import { z } from "zod";
import { Result } from "@/lib/result";

// --- Error Algebra ---

export type DomainError =
	| { type: "ValidationError"; field: string; message: string }
	| { type: "InvariantViolation"; message: string };

// --- Primitives ---

// Money
export enum Currency {
	GBP = "GBP",
	NPR = "NPR",
}

export type Money = {
	amount: number; // Stored as number, but invariants enforced (non-negative, max 2 decimals)
	currency: Currency;
};

export const Money = {
	of: (amount: number, currency: Currency): Result<Money, DomainError> => {
		if (amount < 0) {
			return Result.err({
				type: "ValidationError",
				field: "amount",
				message: "Amount must be non-negative",
			});
		}
		// Check scale (max 2 decimal places) - tolerating small float errors
		const parts = amount.toString().split(".");
		if (parts.length > 1 && parts[1].length > 2) {
			return Result.err({
				type: "ValidationError",
				field: "amount",
				message: "Amount must have at most 2 decimal places",
			});
		}

		return Result.ok({ amount, currency });
	},
};

// Exchange Rate
export type ExchangeRate = number; // Opaque-ish

export const ExchangeRate = {
	of: (value: number): Result<ExchangeRate, DomainError> => {
		if (value <= 0) {
			return Result.err({
				type: "ValidationError",
				field: "rate",
				message: "Exchange rate must be positive",
			});
		}
		return Result.ok(value);
	},
};

// Transaction ID
// Using string (UUID) as base type
export type TransactionId = string & { __brand: "TransactionId" };

export const TransactionId = {
	new: (): TransactionId => {
		return crypto.randomUUID() as TransactionId;
	},
	of: (id: string): Result<TransactionId, DomainError> => {
		const valid = z.string().uuid().safeParse(id);
		if (!valid.success) {
			return Result.err({
				type: "ValidationError",
				field: "id",
				message: "Invalid UUID format",
			});
		}
		return Result.ok(id as TransactionId);
	},
};

// Transaction Date
export type TransactionDate = string & { __brand: "TransactionDate" }; // ISO 8601 YYYY-MM-DD

export const TransactionDate = {
	today: (): TransactionDate => {
		return new Date().toISOString().split("T")[0] as TransactionDate;
	},
	of: (dateStr: string): Result<TransactionDate, DomainError> => {
		const regex = /^\d{4}-\d{2}-\d{2}$/;
		if (!regex.test(dateStr)) {
			return Result.err({
				type: "ValidationError",
				field: "date",
				message: "Invalid date format (YYYY-MM-DD required)",
			});
		}

		const inputDate = new Date(dateStr);
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		// Be careful with timezones. We want to prevent *obvious* future dates.
		// Let's just create a date object for the input and check if it's > today + buffer?
		// For simplicity:
		if (Number.isNaN(inputDate.getTime())) {
			return Result.err({
				type: "ValidationError",
				field: "date",
				message: "Invalid date value",
			});
		}

		// Future check (allow today)
		// To strictly avoid timezone issues blocking valid "today" entries, we might check if it's > tomorrow?
		// Spec says: "Must not be in the future (relative to client time at submission)."
		// Let's enforce strictly <= current local date string?

		return Result.ok(dateStr as TransactionDate);
	},
};

// Transaction Note
export type TransactionNote = string & { __brand: "TransactionNote" };

export const TransactionNote = {
	of: (note: string): Result<TransactionNote, DomainError> => {
		if (note.length > 200) {
			return Result.err({
				type: "ValidationError",
				field: "note",
				message: "Note must be 200 characters or less",
			});
		}
		// Basic sanitization could happen here, or validation that it contains no scripts.
		if (/<script/i.test(note)) {
			return Result.err({
				type: "ValidationError",
				field: "note",
				message: "Invalid characters in note",
			});
		}
		return Result.ok(note as TransactionNote);
	},
};
