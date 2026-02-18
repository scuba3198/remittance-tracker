import { Currency, Money, TransactionId } from "@/domain/primitives";
import { RemittanceTransaction as TransactionEntity } from "@/domain/transaction";

describe("Domain Logic & Invariants", () => {
	describe("Money Precision Invariant", () => {
		it("should strictly reject amounts with > 2 decimal places", () => {
			// Logic Error: Attempting to store sub-penny precision
			const result = Money.of(100.123, Currency.GBP);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.type).toBe("ValidationError");
				expect(result.error.message).toContain("at most 2 decimal places");
			}
		});

		it("should accept valid 2 decimal amounts", () => {
			const result = Money.of(100.12, Currency.GBP);
			expect(result.success).toBe(true);
		});

		it("should accept integer amounts", () => {
			const result = Money.of(100, Currency.GBP);
			expect(result.success).toBe(true);
		});
	});

	describe("Transaction Integrity", () => {
		it("should fail atomically if any component is invalid", () => {
			// Logic Error: One invalid field should invalidate the whole aggregate
			const result = TransactionEntity.create({
				id: TransactionId.new(),
				sourceAmount: 100.0,
				targetAmount: -500.0, // Invalid: Negative money
				exchangeRate: 1.5,
				date: "2023-10-10",
			});

			expect(result.success).toBe(false);
			// The error should bubble up from Money validation
			if (!result.success && result.error.type === "ValidationError") {
				expect(result.error.field).toBe("amount");
			}
		});

		it("should fail if Date is malformed", () => {
			const result = TransactionEntity.create({
				id: TransactionId.new(),
				sourceAmount: 100.0,
				targetAmount: 150.0,
				exchangeRate: 1.5,
				date: "invalid-date", // Logic Error: Bad Format
			});

			expect(result.success).toBe(false);
			if (!result.success && result.error.type === "ValidationError") {
				expect(result.error.field).toBe("date");
			}
		});
	});
});
