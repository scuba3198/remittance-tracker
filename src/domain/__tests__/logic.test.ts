import {
	Currency,
	ExchangeRate,
	Money,
	TransactionId,
} from "@/domain/primitives";
import { RemittanceTransaction as TransactionEntity } from "@/domain/transaction";

describe("Domain Logic & Invariants", () => {
	describe("Money Precision Invariant", () => {
		it("should strictly reject amounts with > 2 decimal places", () => {
			const result = Money.of("100.123", Currency.GBP);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.type).toBe("ValidationError");
				expect(result.error.message).toContain("at most 2 decimal places");
			}
		});

		it("should accept valid 2 decimal amounts and store as BigInt minor units", () => {
			const result = Money.of("100.12", Currency.GBP);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.value.minorUnits).toBe(10012n);
			}
		});
	});

	describe("Financial Determinism (Zombie Bug Prevention)", () => {
		it("should correctly handle 1.00 GBP * 1.005 Rate using half-up rounding (Integer Math)", () => {
			// USERS "Zombie" Bug Scenario:
			// Amount: 100 pence (£1.00)
			// Rate: 1.005
			// Native Float (100 * 1.005) = 100.49999999999999 -> rounds to 100
			// Integer Math ((100 * 1005000) + 500000) / 1000000 = 101 -> rounds to 101

			const gbpResult = Money.of("1.00", Currency.GBP);
			const rateResult = ExchangeRate.of("1.005");

			if (gbpResult.success && rateResult.success) {
				const npr = Money.multiplyByRate(
					gbpResult.value,
					rateResult.value,
					Currency.NPR,
				);

				expect(npr.minorUnits).toBe(101n);
				expect(Money.toDecimalString(npr)).toBe("1.01");
			} else {
				throw new Error("Conversion setup failed");
			}
		});

		it("should handle 0.1 + 0.2 equivalent precision in Money.of", () => {
			const m1Result = Money.of("0.10", Currency.GBP);
			const m2Result = Money.of("0.20", Currency.GBP);

			if (m1Result.success && m2Result.success) {
				expect(m1Result.value.minorUnits + m2Result.value.minorUnits).toBe(30n); // Exactly 30 pence
			} else {
				throw new Error("Money promotion failed");
			}
		});
	});

	describe("Transaction Integrity", () => {
		it("should fail atomically if any component is invalid", () => {
			const result = TransactionEntity.create({
				id: TransactionId.new(),
				sourceAmount: "100.00",
				targetAmount: "-500.00",
				exchangeRate: "1.50",
				date: "2023-10-10",
			});

			expect(result.success).toBe(false);
			if (!result.success && result.error.type === "ValidationError") {
				expect(result.error.field).toBe("amount");
			}
		});
	});
});
