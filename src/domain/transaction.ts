import { Result } from '@/lib/result';
import {
    Currency,
    DomainError,
    ExchangeRate,
    Money,
    TransactionDate,
    TransactionId,
    TransactionNote,
} from './primitives';

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
        sourceAmount: number; // Raw number
        targetAmount: number; // Raw number
        exchangeRate: number; // Raw number
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

        // 7. Cross-Field Inquiries / Invariants
        // "target_amount should be approximately source_amount * exchange_rate"
        // We allow variance, so we don't strictly reject if it doesn't match exactly.
        // The user might have manually edited the target amount.
        // However, if strictness is required:
        // const expectedTarget = props.sourceAmount * props.exchangeRate;
        // ... check with tolerance ...
        // For now, based on "target converted nepali rupees (which can be edited)",
        // we accept the user's input as truth.

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
