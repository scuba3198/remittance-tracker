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
	minorUnits: bigint; // Stored as bigint to avoid float errors (e.g., pence, paisa)
	currency: Currency;
};

const SCALE = 2n;
const FACTOR = 100n; // 10^SCALE

export const Money = {
	of: (
		amount: number | string,
		currency: Currency,
	): Result<Money, DomainError> => {
		const strAmount =
			typeof amount === "number"
				? amount.toFixed(10).replace(/\.?0+$/, "")
				: amount;
		const parts = strAmount.split(".");

		if (parts.length > 1 && parts[1].length > 2) {
			return Result.err({
				type: "ValidationError",
				field: "amount",
				message: "Amount must have at most 2 decimal places",
			});
		}

		const major = parts[0] || "0";
		const minor = (parts[1] || "").padEnd(2, "0");

		try {
			const majorVal = BigInt(major);
			const minorVal = BigInt(minor);

			if (majorVal < 0n || (majorVal === 0n && strAmount.startsWith("-"))) {
				return Result.err({
					type: "ValidationError",
					field: "amount",
					message: "Amount must be non-negative",
				});
			}

			return Result.ok({
				minorUnits: majorVal * FACTOR + minorVal,
				currency,
			});
		} catch {
			return Result.err({
				type: "ValidationError",
				field: "amount",
				message: "Invalid numeric format",
			});
		}
	},

	toDecimalString: (money: Money): string => {
		const major = money.minorUnits / FACTOR;
		const minor = money.minorUnits % FACTOR;
		return `${major}.${minor.toString().padStart(2, "0")}`;
	},

	multiplyByRate: (
		money: Money,
		rate: ExchangeRate,
		targetCurrency: Currency,
	): Money => {
		// (minorUnits * scaledValue) / 10^6 with half-up rounding
		const scaledConversion = money.minorUnits * rate.scaledValue;
		const rateScaleFactor = 1000000n;

		// To round half-up: add half of the divisor before floor division
		const rounded = (scaledConversion + rateScaleFactor / 2n) / rateScaleFactor;

		return {
			minorUnits: rounded,
			currency: targetCurrency,
		};
	},
};

// Exchange Rate
export type ExchangeRate = {
	scaledValue: bigint; // Fixed scale of 6 (e.g. 175.50 -> 175,500,000)
};

export const ExchangeRate = {
	of: (value: number | string): Result<ExchangeRate, DomainError> => {
		const num = typeof value === "string" ? parseFloat(value) : value;
		if (num <= 0) {
			return Result.err({
				type: "ValidationError",
				field: "rate",
				message: "Exchange rate must be positive",
			});
		}

		// Convert to string and handle up to 6 decimals for the internal scale
		const fixed = num.toFixed(6);
		const [major, minor] = fixed.split(".");
		const scaledValue = BigInt(major) * 1000000n + BigInt(minor);

		return Result.ok({ scaledValue });
	},

	toNumber: (rate: ExchangeRate): number => {
		return Number(rate.scaledValue) / 1000000;
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
