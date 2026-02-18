import { Result } from "@/lib/result";
import {
	Currency,
	type DomainError,
	ExchangeRate,
	Money,
	TransactionDate,
	TransactionId,
	TransactionNote,
} from "./primitives";

export type RemittanceTransaction = {
	id: TransactionId;
	sourceAmount: Money;
	targetAmount: Money;
	exchangeRate: ExchangeRate;
	date: TransactionDate;
	note?: TransactionNote;
};

export const RemittanceTransaction = {
	create: (props: {
		id: string; // Raw UUID string
		sourceAmount: number | string; // Raw number or decimal string
		targetAmount: number | string; // Raw number or decimal string
		exchangeRate: number | string; // Raw number or decimal string
		date: string; // Raw ISO date string
		note?: string; // Raw string
	}): Result<RemittanceTransaction, DomainError> => {
		// 1. Validate ID
		const idResult = TransactionId.of(props.id);
		if (!idResult.success) return idResult;

		// 2. Validate Source Amount (Must be GBP)
		const sourceResult = Money.of(props.sourceAmount, Currency.GBP);
		if (!sourceResult.success) return sourceResult;

		// 3. Validate Target Amount (Must be NPR)
		const targetResult = Money.of(props.targetAmount, Currency.NPR);
		if (!targetResult.success) return targetResult;

		// 4. Validate Exchange Rate
		const rateResult = ExchangeRate.of(props.exchangeRate);
		if (!rateResult.success) return rateResult;

		// 5. Validate Date
		const dateResult = TransactionDate.of(props.date);
		if (!dateResult.success) return dateResult;

		// 6. Validate Note (if present)
		let noteResult: TransactionNote | undefined;
		if (props.note) {
			const result = TransactionNote.of(props.note);
			if (!result.success) return result;
			noteResult = result.value;
		}

		// 7. Invariant: Calculation Accuracy (Deterministic)
		// We allow user override, but the domain ensures calculation is exact.
		const _calculatedNpr = Money.multiplyByRate(
			sourceResult.value,
			rateResult.value,
			Currency.NPR,
		);

		// Optional: If we wanted to enforce strict matching, we would check _calculatedNpr === targetResult.value.minorUnits
		// For now, per requirements "target nepali rupees (which can be edited)", we accept the targetAmount.

		return Result.ok({
			id: idResult.value,
			sourceAmount: sourceResult.value,
			targetAmount: targetResult.value,
			exchangeRate: rateResult.value,
			date: dateResult.value,
			note: noteResult,
		});
	},
};
