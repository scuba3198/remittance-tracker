import { Money, Currency, ExchangeRate, TransactionId } from '@/domain/primitives';

describe('Domain Primitives', () => {
    describe('Money', () => {
        it('should create valid Money', () => {
            const result = Money.of(100, Currency.GBP);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value.amount).toBe(100);
                expect(result.value.currency).toBe(Currency.GBP);
            }
        });

        it('should reject negative amount', () => {
            const result = Money.of(-50, Currency.GBP);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.type).toBe('ValidationError');
            }
        });
    });

    describe('ExchangeRate', () => {
        it('should create valid ExchangeRate', () => {
            const result = ExchangeRate.of(1.5);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value).toBe(1.5);
            }
        });

        it('should reject zero or negative rate', () => {
            const zero = ExchangeRate.of(0);
            expect(zero.success).toBe(false);

            const neg = ExchangeRate.of(-1);
            expect(neg.success).toBe(false);
        });
    });

    describe('TransactionId', () => {
        it('should validate correct UUID', () => {
            const uuid = crypto.randomUUID();
            const result = TransactionId.of(uuid);
            expect(result.success).toBe(true);
        });

        it('should reject invalid UUID', () => {
            const result = TransactionId.of('not-a-uuid');
            expect(result.success).toBe(false);
        });
    });
});
